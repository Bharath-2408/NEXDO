import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: 'Need → Understand',
      desc: 'Speak naturally in Tamil or English. NEXDO understands what you need without forcing you to browse dozens of category tiles.',
      icon: <Mic className="w-10 h-10 text-blue-600" />,
      tag: 'Step 1',
    },
    {
      title: 'Match → Book',
      desc: 'NEXDO matches verified nearby technicians who have the exact capabilities needed, upfront pricing, and immediate availability.',
      icon: <CheckCircle2 className="w-10 h-10 text-emerald-600" />,
      tag: 'Step 2',
    },
    {
      title: 'One Account, Dual Persona',
      desc: 'Use the same single NEXDO account as a Customer needing service, or as a verified Technician finding service opportunities.',
      icon: <Shield className="w-10 h-10 text-indigo-600" />,
      tag: 'Step 3',
    },
  ];

  const current = slides[step];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
        {current.icon}
      </div>

      <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
        {current.tag}
      </span>
      <h2 className="text-2xl font-black text-[#071A36]">{current.title}</h2>
      <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-sm mx-auto">
        {current.desc}
      </p>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 my-6">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'
            }`}
          />
        ))}
      </div>

      <div className="space-y-2.5">
        {step < slides.length - 1 ? (
          <Button fullWidth size="lg" onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button fullWidth size="lg" onClick={() => navigate('/login')} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Proceed to Login / Signup
          </Button>
        )}
        <button
          onClick={() => navigate('/login')}
          className="text-xs text-slate-400 hover:text-slate-600 py-1"
        >
          Skip to Authentication
        </button>
      </div>
    </div>
  );
};
