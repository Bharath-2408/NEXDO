import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Phone, Lock, Calendar, ArrowRight } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useApp } from '../../store/AppContext';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [name, setName] = useState('Hariharasudhan');
  const [phone, setPhone] = useState('9876543210');
  const [dob, setDob] = useState('24/08/2007');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast('Account created successfully', 'success');
      navigate('/select-role');
    }, 600);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm text-left">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-[#071A36]">Create Your NEXDO Account</h2>
        <p className="text-xs text-slate-500 mt-1">
          One account gives you full access to both Customer and Technician roles.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hariharasudhan"
          leftIcon={<User className="w-4 h-4" />}
          required
        />

        <Input
          label="Mobile Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="10-digit mobile number"
          leftIcon={<Phone className="w-4 h-4" />}
          required
        />

        <Input
          label="Date of Birth (DD/MM/YYYY)"
          type="text"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          placeholder="24/08/2007"
          leftIcon={<Calendar className="w-4 h-4" />}
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create secure password"
          leftIcon={<Lock className="w-4 h-4" />}
          required
        />

        <Button fullWidth size="lg" type="submit" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
          Register Unified Account
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-600">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
