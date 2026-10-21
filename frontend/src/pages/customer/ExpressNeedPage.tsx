import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, MapPin, Clock, DollarSign, Edit3, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { Button } from '../../components/ui/Button';

export const ExpressNeedPage: React.FC = () => {
  const { activeNeed, setActiveNeed } = useCustomer();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [prevNeed, setPrevNeed] = useState(activeNeed);
  const [editedService, setEditedService] = useState(activeNeed?.normalizedService || 'Service Request');
  const [editedTime, setEditedTime] = useState(activeNeed?.preferredTime || 'Flexible / To be scheduled');

  if (activeNeed !== prevNeed) {
    setPrevNeed(activeNeed);
    setEditedService(activeNeed?.normalizedService || 'Service Request');
    setEditedTime(activeNeed?.preferredTime || 'Flexible / To be scheduled');
  }

  const handleConfirm = () => {
    if (activeNeed) {
      setActiveNeed({
        ...activeNeed,
        normalizedService: editedService,
        preferredTime: editedTime,
      });
    }
    navigate('/customer/providers');
  };

  return (
    <div className="max-w-xl mx-auto text-left space-y-6 pb-12">
      {/* Top Breadcrumb */}
      <button
        onClick={() => navigate('/customer')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* AI Understanding Card */}
      <div className="bg-white rounded-3xl border border-blue-200/90 shadow-sm p-6 sm:p-8 space-y-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Intent Understanding</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#071A36] tracking-tight">
            We understood your request
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Based on: <em className="text-slate-800 font-semibold">"{activeNeed?.rawTranscript || 'Direct Service'}"</em>
          </p>
        </div>

        {/* Structured Understanding Grid */}
        <div className="space-y-3.5 p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Identified Service
            </span>
            {isEditing ? (
              <input
                type="text"
                value={editedService}
                onChange={(e) => setEditedService(e.target.value)}
                className="w-full mt-1.5 p-3 rounded-xl border border-slate-300 text-sm font-bold bg-white focus-ring shadow-2xs"
              />
            ) : (
              <p className="text-base font-black text-[#071A36] mt-0.5">{editedService}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Preferred Schedule
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTime}
                  onChange={(e) => setEditedTime(e.target.value)}
                  className="w-full mt-1.5 p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white focus-ring shadow-2xs"
                />
              ) : (
                <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 mt-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{editedTime}</span>
                </p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Diagnosis Fee
              </span>
              <p className="text-xs font-black text-emerald-700 flex items-center gap-1.5 mt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>₹149 (Repair price after diagnosis)</span>
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Service Location
            </span>
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{activeNeed?.location || 'Adyar & Surrounding Zones, Chennai'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Button
            fullWidth
            size="lg"
            onClick={handleConfirm}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="bg-[#071A36] hover:bg-blue-600 text-white font-bold py-3.5 text-sm shadow-xs"
          >
            Confirm & Match Available Service Providers
          </Button>

          <Button
            fullWidth
            variant="outline"
            size="md"
            onClick={() => setIsEditing(!isEditing)}
            leftIcon={<Edit3 className="w-4 h-4" />}
            className="text-xs font-bold"
          >
            {isEditing ? 'Save Changes' : 'Adjust Service Details'}
          </Button>
        </div>
      </div>
    </div>
  );
};
