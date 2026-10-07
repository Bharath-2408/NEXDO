import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, ArrowLeft } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../store/AppContext';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [phone, setPhone] = useState('9876543210');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    showToast('Reset OTP sent to your phone', 'info');
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm text-left">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-[#071A36]">Account Recovery</h2>
        <p className="text-xs text-slate-500 mt-1">
          Enter your registered mobile number to receive a secure login OTP.
        </p>
      </div>

      {!isSent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mobile Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            leftIcon={<Phone className="w-4 h-4" />}
            required
          />
          <Button fullWidth size="lg" type="submit">
            Send Reset OTP
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
            A verification OTP has been simulated to {phone}.
          </div>
          <Button fullWidth size="lg" onClick={() => navigate('/login')}>
            Return to Login
          </Button>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
};
