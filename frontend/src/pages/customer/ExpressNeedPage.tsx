import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, MapPin, Clock, DollarSign, Edit3, ArrowRight } from 'lucide-react';
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
    <div className="max-w-xl mx-auto text-left space-y-6">
      {/* Top Breadcrumb */}
      <button
        onClick={() => navigate('/customer')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* AI Understanding Card */}
      <div className="bg-white rounded-3xl border border-blue-200 shadow-sm p-6 sm:p-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Intent Understanding</span>
        </div>

        <h2 className="text-2xl font-black text-[#071A36]">
          We understood your request
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Based on: <em className="text-slate-700 font-medium">"{activeNeed?.rawTranscript}"</em>
        </p>

        {/* Structured Understanding Grid */}
        <div className="my-6 space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Identified Service
            </span>
            {isEditing ? (
              <input
                type="text"
                value={editedService}
                onChange={(e) => setEditedService(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 text-sm font-bold bg-white"
              />
            ) : (
              <p className="text-base font-extrabold text-[#071A36] mt-0.5">{editedService}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Preferred Schedule
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={editedTime}
                  onChange={(e) => setEditedTime(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                />
              ) : (
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  {editedTime}
                </p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Diagnosis Fee
              </span>
              <p className="text-xs font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
                <DollarSign className="w-3.5 h-3.5" />
                ₹149 (Repair price decided after diagnosis)
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Service Location
            </span>
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              {activeNeed?.location}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Button fullWidth size="lg" onClick={handleConfirm} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Confirm & Match Available Pros
          </Button>
          <Button
            fullWidth
            variant="outline"
            size="md"
            onClick={() => setIsEditing(!isEditing)}
            leftIcon={<Edit3 className="w-4 h-4" />}
          >
            {isEditing ? 'Save Changes' : 'Adjust Service Details'}
          </Button>
        </div>
      </div>
    </div>
  );
};
