import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Wrench,
  Lock,
  QrCode,
  Sparkles,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { LiveTrackingMapMock } from '../../components/customer/LiveTrackingMapMock';
import { BookingTimeline } from '../../components/customer/BookingTimeline';
import { Button } from '../../components/ui/Button';

export const LiveTrackingPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const {
    bookings,
    advanceBookingStatus,
    payDiagnosisFee,
    approveEstimate,
    verifyFinalOtp,
  } = useCustomer();
  const navigate = useNavigate();

  const booking = bookings.find((b) => b.id === bookingId) || bookings[0];

  const handleAdvance = () => {
    advanceBookingStatus(booking.id);
  };

  const isCompleted = booking.status === 'COMPLETED';
  const isDiagnosing = booking.status === 'DIAGNOSING' || booking.status === 'ARRIVED';
  const isEstimatePending = booking.status === 'ESTIMATE_PENDING';
  const isWorkInProgress = booking.status === 'WORK_IN_PROGRESS' || booking.status === 'IN_PROGRESS';
  const isPaymentPending = booking.status === 'PAYMENT_PENDING';
  const isPaymentReceived = booking.status === 'PAYMENT_RECEIVED' || booking.status === 'OTP_PENDING';

  return (
    <div className="max-w-2xl mx-auto text-left space-y-6 pb-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customer')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
            {booking.status}
          </span>
          <span className="text-xs font-bold text-slate-400 font-mono">Ref: {booking.referenceCode}</span>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-extrabold text-[#071A36]">Live Service Coordination</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time coordination and execution for <strong>{booking.serviceTitle}</strong>.
        </p>
      </div>

      {/* Map Simulation */}
      <LiveTrackingMapMock booking={booking} onAdvanceStep={handleAdvance} />

      {/* REAL-WORLD INTERACTIVE LIFECYCLE ACTION CARDS */}

      {/* 1. DIAGNOSIS CARD (ARRIVED / DIAGNOSING) */}
      {isDiagnosing && (
        booking.serviceMode === 'SERVICE' ? (
          <div className="bg-white rounded-2xl border-2 border-blue-500/80 p-5 shadow-xs space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#071A36]">Direct Service / Repair Requested</h3>
                  <p className="text-xs text-slate-500">No mandatory upfront diagnosis fee</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                Direct Service
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>{booking.provider.name}</strong> is on-site assessing your request. They will provide an itemized estimate for your approval shortly.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-blue-500/80 p-5 shadow-xs space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#071A36]">Step 1: Inspection & Diagnosis</h3>
                  <p className="text-xs text-slate-500">Standard Diagnosis Fee: ₹149</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                Doorstep Inspection
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Diagnosis OTP for Technician:</span>
                <span className="text-base font-black text-[#071A36] font-mono tracking-widest bg-white px-2.5 py-1 rounded border border-slate-300">
                  {booking.diagnosis?.otp || '4821'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Share this 4-digit Diagnosis OTP with <strong>{booking.provider.name}</strong> to authorize inspection.
              </p>
            </div>

            {!booking.diagnosis?.isPaid && (
              <Button
                fullWidth
                size="sm"
                data-voice-action="PAY_DIAGNOSIS"
                onClick={() => payDiagnosisFee(booking.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Pay ₹149 Diagnosis Fee (Test Sandbox)
              </Button>
            )}
          </div>
        )
      )}

      {/* 2. ITEMIZED ESTIMATE CARD (ESTIMATE_PENDING) */}
      {isEstimatePending && (
        <div className="bg-white rounded-2xl border-2 border-amber-500 p-5 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#071A36]">Step 2: Quotation Approval Needed</h3>
                <p className="text-xs text-slate-500">Review technician's itemized repair estimate</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
              Action Required
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2.5">
            <div className="flex justify-between text-slate-700">
              <span>Required Parts (Replacement Capacitor & Wiring):</span>
              <span className="font-bold text-slate-900">₹{booking.estimate?.parts || 700}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Labour & Calibration:</span>
              <span className="font-bold text-slate-900">₹{booking.estimate?.labour || 400}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="font-extrabold text-[#071A36]">Total Itemized Estimate:</span>
              <span className="text-lg font-black text-blue-700">
                ₹{booking.estimate?.total || 1100}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>NEXDO Price Lock:</strong> Once you approve, this price is permanently locked at ₹{booking.estimate?.total || 1100}. No extra charges will be added.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              fullWidth
              size="lg"
              data-voice-action="APPROVE_ESTIMATE"
              onClick={() => approveEstimate(booking.id)}
              className="bg-[#071A36] hover:bg-blue-600 text-white font-bold"
              rightIcon={<Check className="w-4 h-4" />}
            >
              Approve Estimate & Lock Price (₹{booking.estimate?.total || 1100})
            </Button>
          </div>
        </div>
      )}

      {/* 3. WORK IN PROGRESS CARD */}
      {isWorkInProgress && (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-xs space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <h3 className="text-sm font-bold text-[#071A36]">Repair Execution In Progress</h3>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Price Locked: ₹{booking.estimate?.total || 1100}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Technician <strong>{booking.provider.name}</strong> is currently completing the repair. You will receive a notification and QR code once finished.
          </p>
        </div>
      )}

      {/* 4. PAYMENT PENDING (NEXDO QR PROMPT) */}
      {isPaymentPending && (
        <div className="bg-white rounded-2xl border-2 border-blue-600 p-5 shadow-md space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-extrabold text-[#071A36]">Work Completed — Payment Due</h3>
            </div>
            <span className="text-xs font-black text-blue-700">₹{booking.estimate?.total || 1100}</span>
          </div>
          <p className="text-xs text-slate-600">
            Technician has finished the service. Scan the transaction-specific NEXDO QR on their device or proceed via the sandbox payment gateway.
          </p>
          <Button
            fullWidth
            size="lg"
            data-voice-action="INITIATE_PAYMENT"
            onClick={() => navigate(`/customer/payment/${booking.id}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Proceed to Payment (₹{booking.estimate?.total || 1100})
          </Button>
        </div>
      )}

      {/* 5. PAYMENT RECEIVED & FINAL COMPLETION OTP */}
      {isPaymentReceived && (
        <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 shadow-md space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-extrabold text-emerald-950">Payment Received (Sandbox)</h3>
                <p className="text-xs text-emerald-700 font-medium">₹{booking.estimate?.total || 1100} Authorized</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              [SANDBOX MODE]
            </span>
          </div>

          {/* FINAL COMPLETION OTP DISPLAY */}
          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 text-center space-y-2">
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
              Customer Final Completion OTP
            </span>
            <div className="text-3xl font-black text-[#071A36] tracking-widest font-mono select-all">
              {booking.finalOtp?.code || '8942'}
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed max-w-sm mx-auto">
              Please share this <strong>4-digit Final OTP</strong> with your technician after you have inspected their work to verify completion and credit their payout.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              fullWidth
              variant="outline"
              size="sm"
              onClick={() => {
                verifyFinalOtp(booking.id, booking.finalOtp?.code || '8942');
              }}
              className="text-xs"
            >
              Simulate Technician Verified OTP
            </Button>
          </div>
        </div>
      )}

      {/* 6. COMPLETED CELEBRATION */}
      {isCompleted && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 text-center space-y-3 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-emerald-950">Service Fully Completed!</h3>
            <p className="text-xs text-emerald-800 mt-0.5">
              100% of payment (₹{booking.estimate?.total || 1100}) has been credited to {booking.provider.name} with ₹0 platform commission deducted.
            </p>
          </div>
          <Button
            fullWidth
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            onClick={() => navigate(`/customer/review/${booking.id}`)}
          >
            Leave Service Review & Rating
          </Button>
        </div>
      )}

      {/* Step Progress Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#071A36] mb-4">Lifecycle Coordination Milestones</h3>
        <BookingTimeline
          currentStatus={booking.status}
          diagnosisOtp={booking.diagnosis?.otp}
          finalOtp={booking.finalOtp?.code}
          isEstimateApproved={booking.estimate?.isApproved}
          isPaymentDone={booking.status === 'PAYMENT_RECEIVED' || booking.status === 'OTP_PENDING' || booking.status === 'COMPLETED'}
        />
      </div>
    </div>
  );
};
