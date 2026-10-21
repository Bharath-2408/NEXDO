import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  ArrowRight,
  Check,
  Clock,
  Navigation,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { useApp } from '../../store/AppContext';
import { useVoice } from '../../voice/VoiceContext';
import { Button } from '../../components/ui/Button';
import { ServiceMode } from '../../types/customer';
import { useGeolocation } from '../../hooks/useGeolocation';
import { InteractiveMap } from '../../components/map/InteractiveMap';
import { isValidCoordinate } from '../../utils/geoUtils';

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
    null;

  const [serviceMode, setServiceMode] = useState<ServiceMode>('DIAGNOSIS');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [address, setAddress] = useState<string>(
    user.customerProfile?.savedAddresses && user.customerProfile.savedAddresses[0]?.address
      ? user.customerProfile.savedAddresses[0].address
      : '42, Sengunthapuram 3rd Cross, Karur, TN 639002'
  );
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [specialNotes, setSpecialNotes] = useState(activeNeed?.specificIssue || '');

  // Real device/browser Geolocation integration
  const geo = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    autoReverseGeocode: true,
    accuracyThresholdMeters: 500,
  });

  // When GPS detects location, update coordinates and address
  useEffect(() => {
    if (geo.coords && isValidCoordinate(geo.coords.latitude, geo.coords.longitude)) {
      setSelectedCoords({ latitude: geo.coords.latitude, longitude: geo.coords.longitude });
      if (geo.address) {
        setAddress(geo.address);
      }
    }
  }, [geo.coords, geo.address]);

  const handleConfirmBooking = () => {
    if (!provider) {
      showToast('Please select a service provider first', 'warning');
      return;
    }
    const slotToUse = selectedSlot && selectedSlot.trim().length > 0 ? selectedSlot : 'Within 45 mins';
    const booking = createBooking(
      provider.id,
      slotToUse,
      address,
      specialNotes,
      serviceMode,
      selectedCoords?.latitude,
      selectedCoords?.longitude
    );
    showToast('Booking successfully created with service location!', 'success');
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
        const matched = TIME_SLOTS.find(
          (s) => s.toLowerCase().includes(slotQuery) || slotQuery.includes(s.toLowerCase())
        );
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
      if (action.type === 'CONFIRM_BOOKING' || action.type === 'CONFIRM') {
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
      <div className="max-w-xl mx-auto text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">No service provider selected</h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Please select a background-verified provider from the matches list.
        </p>
        <button
          onClick={() => navigate('/customer/providers')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
        >
          Browse Service Providers
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-left space-y-6 pb-12">
      {/* Back to Matches Breadcrumb */}
      <button
        onClick={() => navigate('/customer/providers')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Matches</span>
      </button>

      {/* Main Booking Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step-by-Step Coordination</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#071A36] tracking-tight">
            Confirm Service Booking
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review service schedule, pricing transparency, and doorstep location details.
          </p>
        </div>

        {/* Selected Service Provider Snapshot Card */}
        <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              {provider.avatar ? (
                <img
                  src={provider.avatar}
                  alt={provider.name}
                  className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shadow-2xs"
                />
              ) : (
                <div className="w-13 h-13 rounded-2xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center border border-blue-200">
                  {provider.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
              )}
              {provider.verified && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                </div>
              )}
            </div>
            <div>
              <h4 className="text-base font-extrabold text-[#071A36]">{provider.name}</h4>
              <p className="text-xs font-bold text-blue-700">{provider.primaryCapability}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {provider.experienceYears ?? 0} yrs experience · Background verified
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {serviceMode === 'DIAGNOSIS' ? 'Diagnosis Fee' : 'Service Request'}
            </span>
            <span className="text-lg font-black text-[#071A36] block">
              {serviceMode === 'DIAGNOSIS' ? `₹${provider.diagnosisFee || 149}` : 'Direct Service'}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block">
              {serviceMode === 'DIAGNOSIS' ? 'Repair price after diagnosis' : 'No upfront diagnosis fee'}
            </span>
          </div>
        </div>

        {/* Step 1: Service Mode Selection (Transparent Pricing) */}
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5">
            Step 1: Select Service Mode (Required)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mode 1: Diagnosis */}
            <button
              type="button"
              onClick={() => setServiceMode('DIAGNOSIS')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer select-none ${
                serviceMode === 'DIAGNOSIS'
                  ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-extrabold text-[#071A36] flex items-center gap-1.5">
                  {serviceMode === 'DIAGNOSIS' && <Check className="w-4 h-4 text-blue-600" />}
                  1. Diagnosis
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-900 shadow-2xs">
                  ₹149 Fee
                </span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside font-medium">
                <li>Standard ₹149 doorstep inspection fee</li>
                <li>Service provider visits and diagnoses the exact issue</li>
                <li>Repair quotation is locked only after your approval</li>
              </ul>
            </button>

            {/* Mode 2: Direct Service / Repair */}
            <button
              type="button"
              onClick={() => setServiceMode('SERVICE')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer select-none ${
                serviceMode === 'SERVICE'
                  ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-extrabold text-[#071A36] flex items-center gap-1.5">
                  {serviceMode === 'SERVICE' && <Check className="w-4 h-4 text-blue-600" />}
                  2. Service / Repair
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-blue-100 text-blue-900 shadow-2xs">
                  Direct Service
                </span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside font-medium">
                <li>Directly request the service/repair</li>
                <li>No mandatory ₹149 diagnosis fee</li>
                <li>Repair quotation agreed upon service provider arrival</li>
              </ul>
            </button>
          </div>
        </div>

        {/* Step 2: Slot Selection */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              Step 2: Select Appointment Window *
            </label>
            {!selectedSlot && (
              <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Please select a time slot
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TIME_SLOTS.map((slot, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`p-3.5 rounded-xl border text-xs font-bold text-left transition-all focus-ring cursor-pointer select-none ${
                  selectedSlot === slot
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200/90 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{slot}</span>
                  {selectedSlot === slot && <Check className="w-4 h-4 text-blue-600" />}
                </div>
              </button>
            ))}
          </div>

          {/* Show custom voice selected slot if not matching preset slots */}
          {selectedSlot && !TIME_SLOTS.includes(selectedSlot) && (
            <div className="mt-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Selected Window: <strong>{selectedSlot}</strong>
                </span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedSlot('')}
                className="text-xs text-blue-600 hover:text-blue-800 underline font-bold cursor-pointer"
              >
                Change
              </button>
            </div>
          )}
        </div>

        {/* Step 3: Address Selection with Real GPS Integration */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              Step 3: Service Address & Doorstep Location *
            </label>
            <button
              type="button"
              onClick={() => geo.getCurrentLocation()}
              disabled={geo.loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200/80 transition-colors cursor-pointer disabled:opacity-50 select-none shadow-2xs w-fit"
            >
              {geo.loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              <span>{geo.loading ? 'Detecting GPS...' : 'Use My Current Location'}</span>
            </button>
          </div>

          {/* GPS Error & Fallback Banner */}
          {geo.error && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">{geo.error}</p>
                <p className="text-[11px] text-amber-800">
                  You can type or adjust your exact service address manually in the box below.
                </p>
              </div>
            </div>
          )}

          {/* GPS Low Accuracy Warning */}
          {geo.accuracyWarning && geo.coords && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-900 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>
                GPS accuracy is ±{Math.round(geo.coords.accuracy || 0)}m. Please double-check the address below.
              </span>
            </div>
          )}

          {/* Address Text Area */}
          <div className="relative">
            <div className="absolute top-3.5 left-3.5 pointer-events-none">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter complete door no, street, area, city, pincode..."
              className="w-full pl-10 pr-3 py-3 text-xs font-medium text-slate-800 border border-slate-300 rounded-xl focus-ring bg-white shadow-2xs"
            />
          </div>

          {/* Coordinate Status & Map Preview */}
          {selectedCoords && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
                <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    GPS Lat: {selectedCoords.latitude.toFixed(4)}, Lon: {selectedCoords.longitude.toFixed(4)}
                  </span>
                </span>
                {geo.coords?.accuracy && (
                  <span className="text-slate-400">
                    Accuracy: ±{Math.round(geo.coords.accuracy)}m
                  </span>
                )}
              </div>

              {/* Interactive map preview of customer service location */}
              <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs">
                <InteractiveMap
                  height="180px"
                  customerLocation={{
                    latitude: selectedCoords.latitude,
                    longitude: selectedCoords.longitude,
                    label: 'Service Location',
                    accuracy: geo.coords?.accuracy || null,
                  }}
                  showRouteLine={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Step 4: Special Instructions */}
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
            Step 4: Special Instructions / Problem Notes for Service Provider
          </label>
          <textarea
            rows={2}
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            placeholder="e.g. 2nd floor, water leak inside bedroom unit..."
            className="w-full p-3.5 text-xs font-medium text-slate-800 border border-slate-300 rounded-xl focus-ring shadow-2xs"
          />
        </div>

        {/* Transparent Bill Breakdown Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Price & Fee Transparency
          </span>
          <div className="flex justify-between items-center text-slate-700">
            <span>{serviceMode === 'DIAGNOSIS' ? 'Diagnosis & Inspection Fee:' : 'Direct Service Booking:'}</span>
            <span className="font-extrabold text-[#071A36]">
              {serviceMode === 'DIAGNOSIS' ? `₹${provider.diagnosisFee || 149}` : '₹0 Upfront'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Platform Commission:</span>
            <span className="font-bold text-emerald-700">₹0 (Zero Commission)</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Cancellation Policy:</span>
            <span className="font-semibold text-slate-700">Free before technician dispatch</span>
          </div>
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-[#071A36]">
            <span>Total Payable on Doorstep Arrival:</span>
            <span className="text-blue-700 text-base">
              {serviceMode === 'DIAGNOSIS' ? `₹${provider.diagnosisFee || 149}` : 'Agreed on Arrival'}
            </span>
          </div>
        </div>

        {/* Confirmation Button */}
        <Button
          fullWidth
          size="lg"
          onClick={handleConfirmBooking}
          disabled={!selectedSlot || selectedSlot.trim().length === 0}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="bg-[#071A36] hover:bg-blue-600 text-white font-bold shadow-xs py-4 text-sm"
        >
          {serviceMode === 'DIAGNOSIS'
            ? `Confirm Diagnosis Request (₹${provider.diagnosisFee || 149} Fee)`
            : 'Confirm Service / Repair Request'}
        </Button>
      </div>
    </div>
  );
};
