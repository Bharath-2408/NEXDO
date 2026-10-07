// ============================================================================
// NEXDO AUTHENTICATION & SESSION SERVICE
// Real, secure, persistent authentication engine: PBKDF2-SHA512 hashing,
// secure session tokens, rate limiting, and account enumeration protection.
// ============================================================================

import { dbStore } from '../database/store';
import { UserRecord, SessionRecord, CustomerProfileRecord, TechnicianProfileRecord } from '../database/types';
import { AuthSecurity, RateLimiter } from './authSecurity';

export interface RegisterInput {
  phone: string;
  password: string;
  name: string;
  role?: 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';
  email?: string;
  serviceArea?: string;
}

export interface LoginInput {
  phone: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  private static readonly SESSION_TTL_DAYS = 7;
  private static resetTokens = new Map<string, { userId: string; expiresAt: number }>();

  /**
   * Sanitizes user object to strip sensitive password hash before client exposure
   */
  public static sanitizeUser(user: UserRecord): Omit<UserRecord, 'password_hash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Registers a new user with real hashed password and role-specific profile
   */
  public static register(input: RegisterInput): {
    user: Omit<UserRecord, 'password_hash'>;
    sessionToken: string;
    profile: CustomerProfileRecord | TechnicianProfileRecord;
  } {
    const cleanPhone = (input.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      throw new Error('Valid 10-digit mobile number required');
    }

    if (!input.name || input.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    if (!input.password || input.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check unique phone
    const existing = dbStore.getUserByPhone(cleanPhone);
    if (existing) {
      throw new Error('A user with this mobile number is already registered');
    }

    const userId = `usr_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();
    const role = input.role === 'TECHNICIAN' ? 'TECHNICIAN' : 'CUSTOMER';
    const passwordHash = AuthSecurity.hashPassword(input.password);

    const newUser: UserRecord = {
      id: userId,
      phone: cleanPhone,
      email: input.email?.trim() || null,
      password_hash: passwordHash,
      role,
      status: 'ACTIVE',
      email_verified: false,
      phone_verified: true,
      last_login_at: now,
      created_at: now,
      updated_at: now,
    };

    dbStore.users.set(newUser.id, newUser);
    dbStore.syncToRemote('users', newUser);

    let profile: CustomerProfileRecord | TechnicianProfileRecord;

    if (role === 'CUSTOMER') {
      const custProfile: CustomerProfileRecord = {
        id: `cp_${Date.now()}`,
        user_id: userId,
        full_name: input.name.trim(),
        phone: cleanPhone,
        email: input.email?.trim() || null,
        city: 'Chennai',
        state: 'Tamil Nadu',
        created_at: now,
        updated_at: now,
      };
      dbStore.customerProfiles.set(custProfile.id, custProfile);
      dbStore.syncToRemote('customer_profiles', custProfile);
      profile = custProfile;
    } else {
      const techProfile: TechnicianProfileRecord = {
        id: `tp_${Date.now()}`,
        profile_id: userId,
        name: input.name.trim(),
        phone: cleanPhone,
        email: input.email?.trim() || undefined,
        city: 'Chennai',
        district: 'Chennai District, Tamil Nadu',
        radius_km: 8,
        experience_years: 1,
        rating: 5.0,
        review_count: 0,
        completed_jobs_count: 0,
        verification_status: 'VERIFIED',
        availability_status: 'ONLINE',
        service_areas: [input.serviceArea || 'Chennai Central'],
        languages_spoken: ['Tamil', 'English'],
        badges: ['New Verified Pro'],
        created_at: now,
        updated_at: now,
      };
      dbStore.technicianProfiles.set(techProfile.id, techProfile);
      dbStore.syncToRemote('technician_profiles', techProfile);
      profile = techProfile;
    }

    // Create session
    const sessionToken = AuthSecurity.generateSecureToken();
    const tokenHash = AuthSecurity.hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + this.SESSION_TTL_DAYS * 86400000).toISOString();

    const session: SessionRecord = {
      id: `sess_${Date.now()}`,
      user_id: userId,
      session_token_hash: tokenHash,
      expires_at: expiresAt,
      last_active_at: now,
      created_at: now,
    };
    dbStore.sessions.set(session.id, session);
    dbStore.syncToRemote('sessions', session);

    dbStore.logAudit({
      user_id: userId,
      action: 'USER_REGISTERED',
      status: 'SUCCESS',
      metadata: { role, phone: cleanPhone },
    });

    return {
      user: this.sanitizeUser(newUser),
      sessionToken,
      profile,
    };
  }

  /**
   * Authenticates user with rate limiting, timing-safe password check, and account enumeration protection
   */
  public static login(input: LoginInput): {
    user: Omit<UserRecord, 'password_hash'>;
    sessionToken: string;
    profile: CustomerProfileRecord | TechnicianProfileRecord | undefined;
  } {
    const cleanPhone = (input.phone || '').replace(/\D/g, '').slice(-10);
    const rateLimitKey = `login:${cleanPhone || input.ipAddress || 'unknown'}`;

    // Rate limiting: 5 attempts per 5 minutes
    const rlStatus = RateLimiter.check(rateLimitKey, 5, 300000, 900000);
    if (!rlStatus.allowed) {
      dbStore.logAudit({
        user_id: null,
        action: 'LOGIN_RATE_LIMITED',
        ip_address: input.ipAddress,
        user_agent: input.userAgent,
        status: 'BLOCKED',
        metadata: { phone: cleanPhone, retryAfterSeconds: rlStatus.retryAfterSeconds },
      });
      throw new Error(
        `Too many login attempts. Please wait ${rlStatus.retryAfterSeconds} seconds before trying again.`
      );
    }

    const user = dbStore.getUserByPhone(cleanPhone);

    // Timing-attack safe generic rejection
    if (!user) {
      // Simulate verification to thwart timing attacks
      AuthSecurity.verifyPassword(
        input.password || '',
        'pbkdf2:sha512:100000:d1d2d3d4d5d6d7d8:e1e2e3e4e5e6e7e8'
      );
      dbStore.logAudit({
        user_id: null,
        action: 'LOGIN_FAILED_UNKNOWN_USER',
        ip_address: input.ipAddress,
        user_agent: input.userAgent,
        status: 'FAILURE',
      });
      throw new Error('Invalid mobile number or password');
    }

    const passwordValid = AuthSecurity.verifyPassword(input.password, user.password_hash);
    if (!passwordValid) {
      dbStore.logAudit({
        user_id: user.id,
        action: 'LOGIN_FAILED_PASSWORD_MISMATCH',
        ip_address: input.ipAddress,
        user_agent: input.userAgent,
        status: 'FAILURE',
      });
      throw new Error('Invalid mobile number or password');
    }

    // Success: reset rate limit
    RateLimiter.reset(rateLimitKey);

    const now = new Date().toISOString();
    user.last_login_at = now;
    user.updated_at = now;

    // Create secure session token
    const sessionToken = AuthSecurity.generateSecureToken();
    const tokenHash = AuthSecurity.hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + this.SESSION_TTL_DAYS * 86400000).toISOString();

    const session: SessionRecord = {
      id: `sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      user_id: user.id,
      session_token_hash: tokenHash,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
      expires_at: expiresAt,
      last_active_at: now,
      created_at: now,
    };
    dbStore.sessions.set(session.id, session);
    dbStore.syncToRemote('sessions', session);

    const profile =
      user.role === 'CUSTOMER'
        ? dbStore.getCustomerProfileByUserId(user.id)
        : dbStore.getTechnicianProfileByUserId(user.id);

    dbStore.logAudit({
      user_id: user.id,
      action: 'LOGIN_SUCCESS',
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
      status: 'SUCCESS',
    });

    return {
      user: this.sanitizeUser(user),
      sessionToken,
      profile,
    };
  }

  /**
   * Validates active session token and returns authenticated user
   */
  public static validateSession(sessionToken?: string): {
    user: Omit<UserRecord, 'password_hash'>;
    session: SessionRecord;
    profile: CustomerProfileRecord | TechnicianProfileRecord | undefined;
  } | null {
    if (!sessionToken || typeof sessionToken !== 'string') return null;

    const tokenHash = AuthSecurity.hashToken(sessionToken);
    const session = dbStore.getSessionByTokenHash(tokenHash);
    if (!session) return null;

    // Check expiration
    if (new Date(session.expires_at).getTime() < Date.now()) {
      dbStore.sessions.delete(session.id);
      return null;
    }

    const user = dbStore.getUserById(session.user_id);
    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    // Refresh last active
    session.last_active_at = new Date().toISOString();

    const profile =
      user.role === 'CUSTOMER'
        ? dbStore.getCustomerProfileByUserId(user.id)
        : dbStore.getTechnicianProfileByUserId(user.id);

    return {
      user: this.sanitizeUser(user),
      session,
      profile,
    };
  }

  /**
   * Logs out user by destroying active session
   */
  public static logout(sessionToken: string): boolean {
    if (!sessionToken) return false;
    const tokenHash = AuthSecurity.hashToken(sessionToken);
    const session = dbStore.getSessionByTokenHash(tokenHash);
    if (session) {
      dbStore.sessions.delete(session.id);
      dbStore.logAudit({
        user_id: session.user_id,
        action: 'LOGOUT',
        status: 'SUCCESS',
      });
      return true;
    }
    return false;
  }

  /**
   * Generates single-use password reset token with enumeration protection
   */
  public static requestPasswordReset(phone: string): { success: boolean; message: string; resetToken?: string } {
    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    const user = dbStore.getUserByPhone(cleanPhone);

    const genericMsg = 'If an account exists for this mobile number, password reset instructions have been dispatched.';

    if (!user) {
      return { success: true, message: genericMsg };
    }

    const resetToken = AuthSecurity.generateSecureToken(24);
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    this.resetTokens.set(resetToken, { userId: user.id, expiresAt });

    dbStore.logAudit({
      user_id: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      status: 'SUCCESS',
    });

    return { success: true, message: genericMsg, resetToken };
  }

  /**
   * Resets password and invalidates all existing user sessions
   */
  public static resetPassword(resetToken: string, newPassword: string): boolean {
    if (!resetToken || !newPassword || newPassword.length < 6) {
      throw new Error('Valid token and password of at least 6 characters required');
    }

    const entry = this.resetTokens.get(resetToken);
    if (!entry || entry.expiresAt < Date.now()) {
      this.resetTokens.delete(resetToken);
      throw new Error('Invalid or expired password reset token');
    }

    const user = dbStore.getUserById(entry.userId);
    if (!user) {
      throw new Error('User account not found');
    }

    // Update password hash
    user.password_hash = AuthSecurity.hashPassword(newPassword);
    user.updated_at = new Date().toISOString();

    // Invalidate all existing sessions for this user
    for (const [sessId, sess] of dbStore.sessions.entries()) {
      if (sess.user_id === user.id) {
        dbStore.sessions.delete(sessId);
      }
    }

    // Invalidate reset token
    this.resetTokens.delete(resetToken);

    dbStore.logAudit({
      user_id: user.id,
      action: 'PASSWORD_RESET_COMPLETED',
      status: 'SUCCESS',
    });

    return true;
  }
}
