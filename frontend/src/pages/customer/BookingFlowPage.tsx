import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, ArrowRight, Check, Clock } from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { useApp } from '../../store/AppContext';
import { useVoice } from '../../voice/VoiceContext';
import { Button } from '../../components/ui/Button';
import { ServiceMode } from '../../types/customer';

const TIME_SLOTS = [
  'Tomorrow · 10:00 AM',
  'Tomorrow · 2:00 PM',
  'Tomorrow · 6:00 PM',
  'Day After Tomorrow · 11:00 AM',
];

export const BookingFlowPage: React.FC = () => {
  const { providerId: paramProviderId } = useParams<{ providerId: string }>();
  const [searchParams] = useSearchParams();
  const queryProviderId = searchParams.get('providerId');
  const providerId = paramProviderId || queryProviderId;

  const { getProviderById, createBooking, activeNeed, selectedProvider } = useCustomer();
  const { user, showToast } = useApp();
  const { registerPageActionHandler, updateConversationContext } = useVoice();
  const navigate = useNavigate();

  const provider =
    (providerId ? getProviderById(providerId) : null) ||
    selectedProvider ||
    getProviderById('prov_ravi');

  const [serviceMode, setServiceMode] = useState<ServiceMode>('DIAGNOSIS');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const selectedAddress =
    user.customerProfile.savedAddresses[0]?.address || '42, Sengunthapuram 3rd Cross, Karur, TN 639002';
  const [specialNotes, setSpecialNotes] = useState(activeNeed?.specificIssue || '');

  const handleConfirmBooking = () => {
    if (!provider || !selectedSlot || selectedSlot.trim().length === 0) {
      showToast('Please select an appointment time slot first', 'warning');
      return;
    }
    const booking = createBooking(provider.id, selectedSlot, selectedAddress, specialNotes, serviceMode);
    showToast('Booking successfully created!', 'success');
    navigate(`/customer/booking-confirmation/${booking.id}`);
  };

  const handleConfirmRef = useRef(handleConfirmBooking);
  useEffect(() => {
    handleConfirmRef.current = handleConfirmBooking;
  });

  useEffect(() => {
    if (!provider) return;
    updateConversationContext({
      currentScreen: `/customer/book/${provider.id}`,
      selectedTechnician: provider,
      conversationState: 'BOOKING_IN_PROGRESS',
    });

    const unregister = registerPageActionHandler((action) => {
      if (action.type === 'SELECT_DIAGNOSIS_MODE') {
        setServiceMode('DIAGNOSIS');
        showToast('Selected Diagnosis mode (₹149 Fee)', 'info');
        return true;
      }
      if (action.type === 'SELECT_DIRECT_SERVICE_MODE') {
        setServiceMode('SERVICE');
        showToast('Selected Direct Service mode', 'info');
        return true;
      }
      if (action.type === 'SELECT_BOOKING_SLOT') {
        const slotQuery = (action.payload?.slot || action.payload?.time || '').toLowerCase();
        const matched = TIME_SLOTS.find((s) => s.toLowerCase().includes(slotQuery) || slotQuery.includes(s.toLowerCase()));
        if (matched) {
          setSelectedSlot(matched);
          showToast(`Selected slot: ${matched}`, 'info');
        } else if (action.payload?.slot || action.payload?.time) {
          const customSlot = action.payload?.slot || action.payload?.time;
          setSelectedSlot(customSlot);
          showToast(`Selected slot: ${customSlot}`, 'info');
        }
        return true;
      }
      if (action.type === 'SET_PROBLEM_DESCRIPTION') {
        const desc = action.payload?.text || action.payload?.description || action.payload?.issue || '';
        setSpecialNotes(desc);
        showToast('Problem notes updated', 'info');
        return true;
      }
      if (action.type === 'APPEND_PROBLEM_DESCRIPTION') {
        const desc = action.payload?.text || action.payload?.description || action.payload?.issue || '';
        setSpecialNotes((prev) => (prev ? `${prev}. ${desc}` : desc));
        showToast('Added note to problem description', 'info');
        return true;
      }
      if (action.type === 'CLEAR_PROBLEM_DESCRIPTION') {
        setSpecialNotes('');
        showToast('Cleared problem notes', 'info');
        return true;
      }
      if (action.type === 'REMOVE_LAST_SENTENCE') {
        setSpecialNotes((prev) => {
          const sentences = prev.split(/\.\s+/).filter(Boolean);
          sentences.pop();
          return sentences.join('. ').trim();
        });
        showToast('Removed last sentence from notes', 'info');
        return true;
      }
      if (action.type === 'CONFIRM_BOOKING') {
        handleConfirmRef.current();
        return true;
      }
      if (action.type === 'NAVIGATE_BACK' || action.type === 'GO_BACK') {
        navigate('/customer/providers');
        return true;
      }
      return false;
    });

    return unregister;
  }, [provider, updateConversationContext, registerPageActionHandler, showToast, navigate]);

  if (!provider) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <p className="text-slate-600 mb-4">No technician selected.</p>
        <button
          onClick={() => navigate('/customer/providers')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"
        >
          Select a Technician
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto text-left space-y-6">
      <button
        onClick={() => navigate('/customer/providers')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Matches</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h2 className="text-2xl font-black text-[#071A36]">Confirm Service Booking</h2>
        <p className="text-xs text-slate-500 mt-1">Review your service schedule and coordination details.</p>

        {/* Technician Summary */}
        <div className="my-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={provider.avatar} alt={provider.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
            <div>
              <h4 className="text-sm font-bold text-[#071A36]">{provider.name}</h4>
              <p className="text-xs text-blue-700">{provider.primaryCapability}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              {serviceMode === 'DIAGNOSIS' ? 'Diagnosis Fee' : 'Service Request'}
            </span>
            <span className="text-base font-extrabold text-[#071A36]">
              {serviceMode === 'DIAGNOSIS' ? `₹${provider.diagnosisFee || 149}` : 'Direct Service'}
            </span>
            <span className="text-[10px] text-slate-500 block">
              {serviceMode === 'DIAGNOSIS' ? 'Repair price after diagnosis' : 'No upfront diagnosis fee'}
            </span>
          </div>
        </div>

        {/* Priority 1: Customer Choice of Service Mode */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            Select Service Type (Required)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Choice 1: Diagnosis */}
            <button
              type="button"
              onClick={() => setServiceMode('DIAGNOSIS')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                serviceMode === 'DIAGNOSIS'
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-extrabold text-[#071A36] flex items-center gap-1.5">
                  {serviceMode === 'DIAGNOSIS' && <Check className="w-4 h-4 text-blue-600" />}
                  1. Diagnosis
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  ₹149 Fee
                </span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>₹149 diagnosis fee</li>
                <li>Technician visits and diagnoses the issue</li>
                <li>Repair/service price is decided after diagnosis</li>
              </ul>
            </button>

            {/* Choice 2: Service / Repair */}
            <button
              type="button"
              onClick={() => setServiceMode('SERVICE')}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                serviceMode === 'SERVICE'
                  ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-extrabold text-[#071A36] flex items-center gap-1.5">
                  {serviceMode === 'SERVICE' && <Check className="w-4 h-4 text-blue-600" />}
                  2. Service / Repair
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                  Direct Service
                </span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Directly request the service/repair</li>
                <li>No mandatory ₹149 diagnosis fee</li>
                <li>Repair quotation agreed upon technician arrival</li>
              </ul>
            </button>
          </div>
        </div>

        {/* Slot Selection */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Appointment Window *
            </label>
            {!selectedSlot && (
              <span className="text-[11px] text-amber-600 font-semibold">
                Please select a time slot
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TIME_SLOTS.map((slot, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all focus-ring ${
                  selectedSlot === slot
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>

          {/* Show custom voice selected slot if not matching preset slots */}
          {selectedSlot && !TIME_SLOTS.includes(selectedSlot) && (
            <div className="mt-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Selected Window: <strong>{selectedSlot}</strong></span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedSlot('')}
                className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Address Selection */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Service Address
          </label>
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>{selectedAddress}</span>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Special Instructions / Notes for Pro
          </label>
          <textarea
            rows={2}
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            placeholder="e.g. 2nd floor, water leak inside bedroom unit..."
            className="w-full p-3 text-xs text-slate-800 border border-slate-300 rounded-xl focus-ring"
          />
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={handleConfirmBooking}
          disabled={!selectedSlot || selectedSlot.trim().length === 0}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {serviceMode === 'DIAGNOSIS'
            ? `Confirm Diagnosis Request (₹${provider.diagnosisFee || 149} Fee)`
            : 'Confirm Service / Repair Request'}
        </Button>
      </div>
    </div>
  );
};
