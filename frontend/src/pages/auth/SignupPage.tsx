import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  User,
  Phone,
  Lock,
  Mail,
  MapPin,
  ArrowRight,
  Wrench,
  AlertCircle,
  Check,
  Home,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../store/AppContext';
import { nexdoApi } from '../../api/nexdoApi';
import { SERVICE_DOMAINS } from '../../constants/capabilities';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [roleOverride, setRoleOverride] = useState<'CUSTOMER' | 'TECHNICIAN' | null>(null);
  const selectedRole = roleOverride ?? (searchParams.get('role') === 'technician' ? 'TECHNICIAN' : 'CUSTOMER');
  const setSelectedRole = (role: 'CUSTOMER' | 'TECHNICIAN') => setRoleOverride(role);

  const { showToast, setAuthenticatedUser, isAuthenticated, isAuthLoading, currentRole, getLastAuthorizedPage } = useApp();

  // All fields empty by default: zero demo credentials or prefilled personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstNameError, setFirstNameError] = useState<string | undefined>(undefined);
  const [lastNameError, setLastNameError] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>(undefined);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect to correct last page or dashboard
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && currentRole) {
      const destination = getLastAuthorizedPage(currentRole);
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, currentRole, getLastAuthorizedPage, navigate]);

  const toggleDomain = (code: string) => {
    setSelectedDomains((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFirstNameError(undefined);
    setLastNameError(undefined);
    setPasswordError(undefined);
    setConfirmPasswordError(undefined);

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanFirstName) {
      const msg = 'First name is required.';
      setFirstNameError(msg);
      setErrorMessage('Please enter your first name.');
      return;
    }

    if (!cleanLastName) {
      const msg = 'Last name is required.';
      setLastNameError(msg);
      setErrorMessage('Please enter your last name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Service Provider domain validation: must select at least 1 domain
    if (selectedRole === 'TECHNICIAN' && selectedDomains.length === 0) {
      setErrorMessage('Please select at least one service domain.');
      return;
    }

    if (!password || password.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      setPasswordError(msg);
      setErrorMessage(msg);
      return;
    }

    if (!confirmPassword || password !== confirmPassword) {
      const mismatchMsg = 'Passwords do not match.';
      setConfirmPasswordError(mismatchMsg);
      setErrorMessage(mismatchMsg);
      return;
    }

    setIsLoading(true);

    try {
      // Never send or store confirmPassword in the database
      const fullName = `${cleanFirstName} ${cleanLastName}`.trim();
      const res = await nexdoApi.auth.register({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        name: fullName,
        phone: cleanPhone,
        email: cleanEmail || undefined,
        password,
        role: selectedRole,
        serviceArea: serviceArea.trim() || undefined,
        serviceDomains: selectedRole === 'TECHNICIAN' ? selectedDomains : undefined,
      });

      if (res?.user) {
        setAuthenticatedUser(res.user, res.profile);
        showToast(
          `Registered successfully as ${selectedRole === 'CUSTOMER' ? 'Customer' : 'Service Provider'}`,
          'success'
        );
        navigate(selectedRole === 'CUSTOMER' ? '/customer' : '/technician', { replace: true });
      }
    } catch (err: any) {
      const msg = err.message || 'Registration failed. Please check your details.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const liveConfirmMismatch =
    confirmPassword.length > 0 && password !== confirmPassword
      ? 'Passwords do not match.'
      : confirmPasswordError;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm text-left">
      {/* Top-Left Mandatory Home Navigation Button inside Registration Card */}
      <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <Link
          to="/"
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
          {selectedRole === 'CUSTOMER' ? 'Customer Registration' : 'Service Provider Registration'}
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-[#071A36] tracking-tight">
          {selectedRole === 'CUSTOMER' ? 'Customer Registration' : 'Service Provider Registration'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
          {selectedRole === 'CUSTOMER'
            ? 'Create your NEXDO customer account to book everyday doorstep services with locked upfront diagnosis pricing.'
            : 'Create your NEXDO service provider account, choose the services you offer, and connect with relevant customer requests.'}
        </p>
      </div>

      {/* Role Selection Tabs: Customer Registration vs Service Provider Registration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => {
            setSelectedRole('CUSTOMER');
            setErrorMessage(null);
          }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            selectedRole === 'CUSTOMER'
              ? 'bg-white text-blue-700 shadow-xs ring-1 ring-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 shrink-0" />
          <span>Customer Registration</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedRole('TECHNICIAN');
            setErrorMessage(null);
          }}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            selectedRole === 'TECHNICIAN'
              ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4 shrink-0" />
          <span>Service Provider Registration</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (firstNameError) setFirstNameError(undefined);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Enter your first name"
            leftIcon={<User className="w-4 h-4" />}
            error={firstNameError}
            autoComplete="given-name"
            required
          />

          <Input
            label="Last Name"
            type="text"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (lastNameError) setLastNameError(undefined);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Enter your last name"
            leftIcon={<User className="w-4 h-4" />}
            error={lastNameError}
            autoComplete="family-name"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mobile Number"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Enter your mobile number"
            leftIcon={<Phone className="w-4 h-4" />}
            helperText="10-digit Indian mobile number"
            autoComplete="tel"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="Enter your email address"
            leftIcon={<Mail className="w-4 h-4" />}
            helperText="Used for email login & password recovery"
            autoComplete="email"
          />
        </div>

        {selectedRole === 'TECHNICIAN' && (
          <Input
            label="Base Service Area / District"
            type="text"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            placeholder="Enter your service area"
            leftIcon={<MapPin className="w-4 h-4" />}
          />
        )}

        {/* Multi-Domain Selection for Service Provider Registration */}
        {selectedRole === 'TECHNICIAN' && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1">
                <span>Your Service Domains (Multiple Allowed)</span>
                <span className="text-red-500 font-bold">*</span>
              </label>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                {selectedDomains.length} selected
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Select all service categories you offer. Your selected domains are saved in the database and used for matching customer service requests.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 max-h-72 overflow-y-auto pr-0.5">
              {SERVICE_DOMAINS.map((domain) => {
                const isSelected = selectedDomains.includes(domain.code);
                return (
                  <button
                    key={domain.code}
                    type="button"
                    onClick={() => toggleDomain(domain.code)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                        isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs sm:text-sm font-bold block truncate ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {domain.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {domain.nameTamil}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (passwordError) setPasswordError(undefined);
            if (confirmPasswordError) setConfirmPasswordError(undefined);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="Create a password"
          leftIcon={<Lock className="w-4 h-4" />}
          helperText="Minimum 6 characters"
          error={passwordError}
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
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (confirmPasswordError) setConfirmPasswordError(undefined);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="Confirm your password"
          leftIcon={<Lock className="w-4 h-4" />}
          helperText="Re-enter your password to confirm"
          error={liveConfirmMismatch}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          autoComplete="new-password"
          required
        />

        <Button
          fullWidth
          size="lg"
          type="submit"
          isLoading={isLoading}
          className={`py-3.5 text-sm font-extrabold ${
            selectedRole === 'TECHNICIAN' ? 'bg-emerald-600 hover:bg-emerald-500' : ''
          }`}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Register as {selectedRole === 'CUSTOMER' ? 'Customer' : 'Service Provider'}
        </Button>
      </form>

      <div className="mt-7 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <p className="text-slate-600">
          Already have a NEXDO account?{' '}
          <Link
            to={selectedRole === 'TECHNICIAN' ? '/login?role=technician' : '/login?role=customer'}
            className="font-bold text-blue-600 hover:underline"
          >
            Sign In
          </Link>
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-[#071A36] font-semibold transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>
    </div>
  );
};

