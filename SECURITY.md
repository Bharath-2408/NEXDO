# NEXDO — Production Security & Architecture Standards (SECURITY.md)

## 1. Overview
NEXDO is a 100% voice-first home services marketplace. This document outlines the security architecture, threat model, cryptographic practices, and operational procedures implemented to safeguard customer and service professional data across all layers of the stack.

---

## 2. Authentication Architecture
- **Identity Model**: Single unified identity per user supporting dual roles (`CUSTOMER` and `TECHNICIAN`) and administrative controls (`ADMIN`).
- **Password Hashing**: Cryptographic password hashing utilizing **PBKDF2-SHA512** with 100,000 iterations and 16-byte random salts.
  - Plaintext passwords and hashes are never exposed through API responses or stored in browser client caches.
  - Zero demo or fallback identities loaded at runtime; users must authenticate with valid credentials.
- **Account Enumeration Protection**:
  - Authentication and password reset endpoints return safe, generic responses (`"Invalid mobile number or password"`).
  - Timing attack mitigation: Verification computation is executed even if the mobile number is not found.

---

## 3. Session Management
- **Token Generation**: Cryptographically secure 256-bit random tokens generated via `crypto.randomBytes(32)`.
- **Server-Side Token Storage**: Tokens are stored strictly **hashed** via SHA-256 in the database.
- **Browser Cookies**: Sessions are issued via `HttpOnly`, `Secure`, and `SameSite=Strict` cookies (`__Host-nexdo_session`).
- **Session Lifecycle**:
  - Configurable expiration (default 7 days).
  - Explicit session destruction upon logout.
  - Immediate invalidation of all existing active sessions when a user resets their password.

---

## 4. Rate Limiting & Abuse Prevention
- **Distributed / In-Memory Rate Limiting**:
  - Endpoint protection on `/api/auth/login`, `/api/auth/register`, `/api/auth/reset-password`, and `/api/payments/*`.
  - Progressive backoff and exponential delays: Maximum 5 failed login attempts per 5 minutes per IP/mobile number, followed by a 15-minute lockout period.
- **Audit Logging**:
  - Structured audit trail recorded in `audit_logs` for authentication events (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGIN_RATE_LIMITED`, `USER_REGISTERED`, `PASSWORD_RESET`).
  - Sensitive attributes (passwords, PINs, OTPs, CVVs) are strictly excluded from audit logs and monitoring streams.

---

## 5. Authorization & IDOR Protection
- **Zero-Trust Access Control**:
  - Every API endpoint validates authenticated identity server-side.
  - User identifiers supplied in request bodies or query parameters are cross-checked against the session context.
- **Customer Data Isolation**:
  - Customers can only query, view, or modify their own service requests, bookings, and payments.
  - Attempting to access another customer's booking ID returns `403 Forbidden`.
- **Technician Data Isolation**:
  - Technicians can only access their assigned jobs, earnings ledger, subscription state, and eligible matched requests.
  - Technicians cannot access other technicians' private earnings or job histories.

---

## 6. Server-Authoritative Bookings & Pricing
- **Pricing Enforcement**:
  - Diagnosis Service: Server strictly locks diagnosis fee to ₹149.
  - Direct Service: Server locks diagnosis fee to ₹0.
  - Client-supplied prices are discarded in favor of server-side calculated pricing.
- **Appointment Slot Selection**:
  - Empty initial state: No automatic or default appointment time is pre-selected.
  - Explicit user input (manual UI click or natural voice command) is mandatory to select date/time.
  - Booking confirmation is disabled until a valid appointment slot is chosen.
- **Concurrency & Double-Booking Protection**:
  - Server verifies technician slot availability before confirming bookings, rejecting conflicting requests.
- **Idempotency Keys**:
  - Booking creation supports `X-Idempotency-Key` headers to prevent duplicate records caused by network retries.

---

## 7. Payment Security & Webhook Handling
- **PCI-DSS Compliance**:
  - Sensitive payment credentials (card numbers, CVVs, UPI PINs, net banking passwords) are never handled or stored on NEXDO servers.
- **Server Verification**:
  - Client-side payment status assertions are not trusted.
- **Webhook Cryptographic Verification**:
  - Webhook payloads are verified against HMAC-SHA256 signatures using `PAYMENT_WEBHOOK_SECRET`.
  - Timing-safe comparison (`crypto.timingSafeEqual`) prevents timing attacks.
  - Replay protection: Provider transaction IDs are tracked; duplicate webhook deliveries are handled idempotently.

---

## 8. Technician Presence & Heartbeat Engine
- **Active Presence Tracking**:
  - Entering `/technician` triggers `POST /api/technician/online`.
  - Periodic background heartbeats (`POST /api/technician/heartbeat`) update `last_seen_at`.
  - Automated timeout sweeps mark technicians as `OFFLINE` if no heartbeat is received within 5 minutes.
  - Manual "Go Offline" and logout immediately transition status to `OFFLINE`.

---

## 9. Secret Management
- **Environment Isolation**:
  - Production secrets (database URLs, session keys, payment keys, webhook secrets) are loaded exclusively via environment variables or cloud secret managers.
  - `.env` and `.env.*` files are explicitly excluded from version control via `.gitignore`.
  - `.env.example` contains only non-sensitive template placeholders.

---

## 10. Database Security & Migrations
- **PostgreSQL Relational Schema**:
  - Reproducible migrations in `supabase/migrations/`.
  - Strict foreign keys, unique constraints, and check constraints (`service_mode IN ('DIAGNOSIS', 'SERVICE')`).
  - Indexing on hot lookup fields (`users.phone`, `users.email`, `sessions.session_token_hash`, `bookings.customer_id`, `bookings.technician_id`).
- **Parameterized Queries**:
  - Elimination of raw SQL string concatenation to prevent SQL injection vulnerabilities.

---

## 11. Backup & Disaster Recovery (DR)
- **Recovery Objectives**:
  - **Recovery Point Objective (RPO)**: < 1 hour.
  - **Recovery Time Objective (RTO)**: < 2 hours.
- **Backup Procedures**:
  - Automated daily snapshots and continuous WAL (Write-Ahead Logging) archiving for Point-In-Time Recovery (PITR).
  - Encrypted backups at rest (AES-256).
  - Periodic quarterly restore verification drills to test backup integrity.

---

## 12. OWASP Top 10 Mitigation Matrix
| OWASP Vulnerability | NEXDO Mitigation Strategy |
|---|---|
| **A01: Broken Access Control** | Server-side role validation, session-scoped queries, IDOR blocking on `/api/bookings` and `/api/technician/jobs`. |
| **A02: Cryptographic Failures** | PBKDF2-SHA512 password hashing (100k iter), SHA-256 token hashing, HMAC-SHA256 webhooks, TLS transport. |
| **A03: Injection** | Parameterized queries, schema validation, no user input concatenated into queries. |
| **A04: Insecure Design** | Server-authoritative pricing (₹149/₹0), mandatory empty booking slot, explicit confirmation gates. |
| **A05: Security Misconfiguration** | Strict CORS headers, `HttpOnly` `SameSite=Strict` cookies, non-root application execution. |
| **A06: Vulnerable Components** | Regular `npm audit`, lockfile pinning, dependency vulnerability scanning. |
| **A07: Identification and Authentication Failures** | Rate limiting, brute-force throttling, timing-safe credential verification, single-use reset tokens. |
| **A08: Software and Data Integrity Failures** | HMAC webhook signature verification, signed packages, CI/CD checksum checks. |
| **A09: Security Logging and Monitoring Failures** | Comprehensive audit trail (`audit_logs`) without logging credentials or card data. |
| **A10: Server-Side Request Forgery (SSRF)** | No user-supplied URLs fetched by backend; strictly internal webhooks and preconfigured API endpoints. |

---

## 13. Production Deployment Checklist
1. [ ] Ensure all environment variables are populated from secure platform secret stores.
2. [ ] Verify `.env` is absent from git repositories and build artifacts.
3. [ ] Run `npm audit` and ensure zero critical/high vulnerabilities.
4. [ ] Run `npm run test:voice` (255/255 passing).
5. [ ] Run `npm run test:backend` (79/79 passing).
6. [ ] Run `node scripts/verify_zero_touch_runtime.mjs` (31/31 passing).
7. [ ] Run `npm run test:security` (all security/auth/IDOR tests passing).
8. [ ] Verify HTTPS redirection and TLS 1.3 configuration.
9. [ ] Confirm CORS allowlist matches production domains only.
