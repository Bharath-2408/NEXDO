import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { Button } from '../../components/ui/Button';

export const BookingConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { bookings } = useCustomer();
  const navigate = useNavigate();

  const booking = bookings.find((b) => b.id === bookingId) || bookings[0];

  return (
    <div className="max-w-md mx-auto text-left space-y-6">
      <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
          Booking Confirmed
        </span>
        <h2 className="text-2xl font-black text-[#071A36] mt-1">
          Ref: {booking.referenceCode}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Your service coordination is locked. The assigned technician will arrive during the scheduled window.
        </p>

        {/* Details Card */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Service</span>
            <span className="font-bold text-slate-900">{booking.serviceTitle}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Assigned Pro</span>
            <span className="font-bold text-slate-900">{booking.provider.name}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Schedule</span>
            <span className="font-bold text-slate-900">{booking.scheduledTime}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Arrival OTP</span>
            <span className="font-mono text-sm font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              {booking.otpCode}
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <Button
            fullWidth
            size="lg"
            onClick={() => navigate(`/customer/payment-handoff/${booking.id}`)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Payment Handoff Overview
          </Button>
          <Button
            fullWidth
            variant="outline"
            size="md"
            onClick={() => navigate(`/customer/tracking/${booking.id}`)}
          >
            Go to Live Tracking
          </Button>
        </div>
      </div>
    </div>
  );
};
