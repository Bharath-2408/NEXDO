import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CapabilityManager } from '../../components/technician/CapabilityManager';

export const TechnicianCapabilitiesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto text-left space-y-6">
      <button
        onClick={() => navigate('/technician')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Requests</span>
      </button>

      <div>
        <h2 className="text-2xl font-black text-[#071A36]">Multi-Skill Capability Management</h2>
        <p className="text-xs text-slate-500 mt-1">
          A NEXDO technician is not restricted to a single category. Configure all services you can execute.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <CapabilityManager />
      </div>
    </div>
  );
};
