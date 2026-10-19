import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Home,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../store/AppContext';
import { nexdoApi } from '../../api/nexdoApi';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();

  // Step 1: Request OTP via Email; Step 2: Verify OTP & Reset Password
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [providerWarning, setProviderWarning] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Step 1: Send real OTP / password reset email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setProviderWarning(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const res = await nexdoApi.auth.forgotPassword({ email: cleanEmail });

      if (res.emailDelivery === 'NOT_CONFIGURED') {
        setProviderWarning(
          'Supabase email provider is not configured. Please configure Custom SMTP in Supabase Dashboard (Settings > Auth > SMTP Settings) for real email delivery.'
        );
      } else if (res.emailDelivery === 'FAILED') {
        setProviderWarning(
          `Supabase email delivery failed: ${res.providerError || 'SMTP error'}. Please check SMTP configuration.`
        );
      } else {
        setSuccessInfo(`Password reset instructions and verification code have been dispatched to ${cleanEmail}.`);
        setStep(2);
        setCooldownSeconds(60);
      }
    } catch (err: any) {
      const msg = err.message || 'Unable to process password reset request';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and reset password
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otp || otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code sent to your email');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Verify OTP with trusted backend provider
      const verifyRes = await nexdoApi.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      if (!verifyRes.resetToken) {
        throw new Error('Verification failed. Please request a new code.');
      }

      // 2. Perform password reset with single-use resetToken
      await nexdoApi.auth.resetPassword({
        token: verifyRes.resetToken,
        password: newPassword,
      });

      showToast('Password reset successfully! Please sign in with your new password.', 'success');
      navigate('/login', { replace: true });
    } catch (err: any) {
      const msg = err.message || 'OTP verification or password reset failed';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm text-left">
      {/* Top-Left Mandatory Home Navigation Button inside Password Recovery Card */}
      <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 hover:border-blue-300 text-xs sm:text-sm font-bold transition-all focus-ring"
          aria-label="Home — Return to Public Landing Page"
        >
          <Home className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Home</span>
        </Link>

        <span className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-extrabold tracking-wide bg-slate-100 text-slate-700 border border-slate-200">
          Password Recovery
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-[#071A36] tracking-tight">Account Recovery</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
          {step === 1
            ? 'Enter your registered email address to receive a secure verification code.'
            : 'Enter the 6-digit code sent to your email along with your new password.'}
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Provider Missing Configuration Notice (Honest reporting per Requirement 5) */}
      {providerWarning && (
        <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-800 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Email Provider Configuration Notice</span>
          </div>
          <p className="leading-relaxed">{providerWarning}</p>
        </div>
      )}

      {/* Success Info */}
      {successInfo && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{successInfo}</span>
        </div>
      )}

      {/* STEP 1: Enter Email & Request OTP */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <Input
            label="Registered Email Address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Enter your email address"
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="email"
            required
          />

          <Button
            fullWidth
            size="lg"
            type="submit"
            isLoading={isLoading}
            className="py-3.5 text-sm font-extrabold"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Send Verification Code
          </Button>
        </form>
      )}

      {/* STEP 2: Verify OTP & Set New Password */}
      {step === 2 && (
        <form onSubmit={handleVerifyAndReset} className="space-y-4 sm:space-y-5">
          <div>
            <Input
              label="6-Digit Verification Code (OTP)"
              type="text"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Enter 6-digit code"
              leftIcon={<KeyRound className="w-4 h-4" />}
              autoComplete="one-time-code"
              required
            />
            <div className="flex justify-between items-center mt-1.5 text-xs">
              <span className="text-slate-400">Code expires in 10 minutes</span>
              <button
                type="button"
                disabled={cooldownSeconds > 0 || isLoading}
                onClick={handleRequestOtp}
                className="text-blue-600 hover:underline disabled:text-slate-400 flex items-center gap-1 cursor-pointer font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend Code'}</span>
              </button>
            </div>
          </div>

          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="At least 6 characters"
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
            required
          />

          <Input
            label="Confirm New Password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Re-enter new password"
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
            required
          />

          <Button
            fullWidth
            size="lg"
            type="submit"
            isLoading={isLoading}
            className="py-3.5 text-sm font-extrabold"
            rightIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Verify OTP & Reset Password
          </Button>

          <button
            type="button"
            onClick={() => {
              setStep(1);
              setErrorMessage(null);
            }}
            className="w-full py-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 text-center cursor-pointer"
          >
            Change Email Address
          </button>
        </form>
      )}

      <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-[#071A36]"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
      </div>
    </div>
  );
};

