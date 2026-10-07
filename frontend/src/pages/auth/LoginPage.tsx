import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Lock, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../store/AppContext';
import { useVoice } from '../../voice/VoiceContext';
import { nexdoApi } from '../../api/nexdoApi';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, setAuthenticatedUser } = useApp();
  const { registerPageActionHandler, updateConversationContext } = useVoice();
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const res = await nexdoApi.auth.login({ phone, password });
      if (res?.user) {
        setAuthenticatedUser(res.user, res.profile);
      }
      showToast('Logged in successfully', 'success');
      navigate('/select-role');
    } catch (err: any) {
      showToast(err.message || 'Invalid mobile number or password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

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
        navigate('/signup');
        return true;
      }
      if (action.type === 'NAVIGATE_FORGOT_PASSWORD') {
        navigate('/forgot-password');
        return true;
      }
      return false;
    });

    return unregister;
  }, [registerPageActionHandler, updateConversationContext, navigate]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm text-left">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-[#071A36]">Welcome to NEXDO</h2>
        <p className="text-xs text-slate-500 mt-1">
          Sign in to your unified account for customer and technician access.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter 10-digit mobile number"
          leftIcon={<Phone className="w-4 h-4" />}
          required
        />

        <div>
          <Input
            label="Password / OTP"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />
          <div className="flex justify-end mt-1">
            <Link to="/forgot-password" className="text-[11px] text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button fullWidth size="lg" type="submit" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
          Sign In
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-600">
          Don't have a NEXDO account?{' '}
          <Link to="/signup" className="font-bold text-blue-600 hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
};
