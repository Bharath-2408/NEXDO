import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  Lock,
  ArrowRight,
  User,
  Wrench,
  AlertCircle,
  Home,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../store/AppContext';
import { useVoice } from '../../voice/VoiceContext';
import { nexdoApi } from '../../api/nexdoApi';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [roleOverride, setRoleOverride] = useState<'CUSTOMER' | 'TECHNICIAN' | null>(null);
  const selectedRole = roleOverride ?? (searchParams.get('role') === 'technician' ? 'TECHNICIAN' : 'CUSTOMER');
  const setSelectedRole = (role: 'CUSTOMER' | 'TECHNICIAN') => setRoleOverride(role);

  const { showToast, setAuthenticatedUser, isAuthenticated, isAuthLoading, currentRole, getLastAuthorizedPage } = useApp();
  const { registerPageActionHandler, updateConversationContext } = useVoice();

  // Keep all fields empty by default: zero prefilled or persisted credentials
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimitWait, setRateLimitWait] = useState<number | null>(null);

  // Clear all login fields (Mobile Number / Email Address / Username, Password)
  const clearAllLoginFields = useCallback((preserveError = false) => {
    setIdentifier('');
    setPassword('');
    setShowPassword(false);
    if (!preserveError) {
      setErrorMessage(null);
    }
    setFormResetKey((prev) => prev + 1);
  }, []);

  // Clear login fields when LoginPage is opened, navigated to, or restored via browser Back/Forward
  useEffect(() => {
    setRoleOverride(null);
    clearAllLoginFields(false);

    const handlePageShowOrPopState = () => {
      clearAllLoginFields(false);
    };

    window.addEventListener('pageshow', handlePageShowOrPopState);
    window.addEventListener('popstate', handlePageShowOrPopState);

    return () => {
      window.removeEventListener('pageshow', handlePageShowOrPopState);
      window.removeEventListener('popstate', handlePageShowOrPopState);
      // Clear in-memory form state on unmount
      setIdentifier('');
      setPassword('');
      setShowPassword(false);
    };
  }, [location.key, location.pathname, location.search, clearAllLoginFields]);

  // Also clear fields whenever authentication state transitions to unauthenticated (e.g. after logout)
  useEffect(() => {
    if (!isAuthenticated) {
      clearAllLoginFields(false);
    }
  }, [isAuthenticated, clearAllLoginFields]);

  // Switch between Customer Login and Technician / Service Provider Login
  const handleRoleChange = (role: 'CUSTOMER' | 'TECHNICIAN') => {
    setSelectedRole(role);
    clearAllLoginFields(false);
  };

  // Requirement 3: If already logged in, redirect to correct last page or dashboard
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && currentRole) {
      const destination = getLastAuthorizedPage(currentRole);
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, currentRole, getLastAuthorizedPage, navigate]);

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitWait === null || rateLimitWait <= 0) return;
    const timer = setInterval(() => {
      setRateLimitWait((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitWait]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (rateLimitWait && rateLimitWait > 0) {
      showToast(`Please wait ${rateLimitWait} seconds before retrying`, 'warning');
      return;
    }

    const cleanId = identifier.trim();
    if (!cleanId) {
      setPassword('');
      setShowPassword(false);
      setErrorMessage('Please enter your mobile number, email address, or username');
      return;
    }

    if (!password || password.length < 6) {
      setPassword('');
      setShowPassword(false);
      setErrorMessage('Please enter your password (minimum 6 characters)');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        identifier: cleanId,
        expectedRole: selectedRole,
        password,
      };

      const res = await nexdoApi.auth.login(payload);
      if (res?.user) {
        // Clear all login form fields immediately after successful login
        clearAllLoginFields(false);
        setAuthenticatedUser(res.user, res.profile);
        const actualRole = res.user.role === 'TECHNICIAN' ? 'TECHNICIAN' : 'CUSTOMER';

        showToast(
          `Signed in successfully as ${actualRole === 'CUSTOMER' ? 'Customer' : 'Service Provider'}`,
          'success'
        );

        // Restore user's last valid authorized page for that role
        const targetPage = getLastAuthorizedPage(actualRole);
        navigate(targetPage, { replace: true });
      }
    } catch (err: any) {
      // Clear sensitive form values after failed login attempt
      clearAllLoginFields(true);
      const msg = err.message || 'Invalid credentials or password';
      setErrorMessage(msg);

      if (err.status === 429 || err.retryAfterSeconds) {
        const wait = Number(err.retryAfterSeconds) || 60;
        setRateLimitWait(wait);
        showToast(msg, 'warning');
      } else {
        showToast(msg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  useEffect(() => {
    updateConversationContext({
      currentScreen: '/login',
    });

    const unregister = registerPageActionHandler((action) => {
      if (action.type === 'SUBMIT_LOGIN' || action.type === 'CONTINUE') {
        handleSubmitRef.current();
        return true;
      }
      if (action.type === 'NAVIGATE_SIGNUP') {
        navigate(selectedRole === 'TECHNICIAN' ? '/signup?role=technician' : '/signup?role=customer');
        return true;
      }
      if (action.type === 'NAVIGATE_FORGOT_PASSWORD') {
        navigate('/forgot-password');
        return true;
      }
      return false;
    });

    return unregister;
  }, [registerPageActionHandler, updateConversationContext, navigate, selectedRole]);

  const roleLabel = selectedRole === 'CUSTOMER' ? 'Customer' : 'Service Provider';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm text-left">
      {/* Top-Left Mandatory Home Navigation Button inside Login Card */}
      <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <Link
          to="/"
          onClick={() => clearAllLoginFields(false)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 hover:border-blue-300 text-xs sm:text-sm font-bold transition-all focus-ring"
          aria-label="Home — Return to Public Landing Page"
        >
          <Home className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Home</span>
        </Link>

        <span
          className={`px-3 py-1 rounded-full text-[11px] sm:text-xs font-extrabold tracking-wide ${
            selectedRole === 'CUSTOMER'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {roleLabel} Portal
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-[#071A36] tracking-tight">
          {selectedRole === 'CUSTOMER' ? 'Customer Login' : 'Service Provider Login'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
          {selectedRole === 'CUSTOMER'
            ? 'Sign in with your mobile number, email address, or username to book and manage everyday doorstep services.'
            : 'Sign in with your mobile number, email address, or username to access customer service requests with 0% booking commission.'}
        </p>
      </div>

      {/* Role Selector: Customer Login vs Service Provider Login */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => handleRoleChange('CUSTOMER')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            selectedRole === 'CUSTOMER'
              ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>Customer Login</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('TECHNICIAN')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            selectedRole === 'TECHNICIAN'
              ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4 shrink-0" />
          <span>Service Provider Login</span>
        </button>
      </div>

      {/* Error / Rate Limiting Alert */}
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <div>
            <span>{errorMessage}</span>
            {rateLimitWait && rateLimitWait > 0 && (
              <span className="block font-bold mt-1 text-red-800">
                Retry available in {rateLimitWait} seconds.
              </span>
            )}
          </div>
        </div>
      )}

      <form
        key={`login-form-${selectedRole}-${formResetKey}`}
        onSubmit={handleSubmit}
        autoComplete="off"
        className="space-y-5"
      >
        <Input
          label="Mobile Number / Email Address / Username"
          type="text"
          name={`nexdo_login_identifier_${selectedRole.toLowerCase()}`}
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="Enter mobile number, email, or username"
          leftIcon={<User className="w-4 h-4" />}
          helperText="Enter your registered 10-digit mobile number, email address, or username"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          data-lpignore="true"
          data-form-type="other"
          required
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name={`nexdo_login_password_${selectedRole.toLowerCase()}`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Enter your password"
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            autoComplete="new-password"
            data-lpignore="true"
            data-form-type="other"
            required
          />
          <div className="flex justify-end mt-1.5">
            <Link
              to="/forgot-password"
              onClick={() => clearAllLoginFields(false)}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          type="submit"
          isLoading={isLoading}
          disabled={Boolean(rateLimitWait && rateLimitWait > 0)}
          className={`py-3.5 text-sm font-extrabold ${
            selectedRole === 'TECHNICIAN' ? 'bg-emerald-600 hover:bg-emerald-500' : ''
          }`}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {rateLimitWait
            ? `Wait ${rateLimitWait}s`
            : `Sign In as ${selectedRole === 'CUSTOMER' ? 'Customer' : 'Service Provider'}`}
        </Button>
      </form>

      <div className="mt-7 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <p className="text-slate-600">
          Don't have a NEXDO account?{' '}
          <Link
            to={selectedRole === 'TECHNICIAN' ? '/signup?role=technician' : '/signup?role=customer'}
            onClick={() => clearAllLoginFields(false)}
            className="font-bold text-blue-600 hover:underline"
          >
            Register as {selectedRole === 'CUSTOMER' ? 'Customer' : 'Service Provider'}
          </Link>
        </p>

        <Link
          to="/"
          onClick={() => clearAllLoginFields(false)}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#071A36] font-semibold transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

