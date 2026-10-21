import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck, MapPin, Calendar, KeyRound } from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { Button } from '../../components/ui/Button';

export const BookingConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { bookings } = useCustomer();
  const navigate = useNavigate();

  const booking = bookings.find((b) => b.id === bookingId) || bookings[0];

  return (
    <div className="max-w-md mx-auto text-left space-y-6 pb-12">
      <div className="bg-white rounded-3xl border border-emerald-200/90 p-6 sm:p-8 shadow-xs text-center relative overflow-hidden">
        {/* Top Celebration Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />

        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-2xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="text-xs font-black text-emerald-700 uppercase tracking-wider block">
          Booking Confirmed
        </span>
        <h2 className="text-2xl font-black text-[#071A36] mt-1">
          Ref: {booking.referenceCode}
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
          Your service coordination is locked. Your assigned professional will arrive during the scheduled window.
        </p>

        {/* Details Card */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 text-left space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
            <span className="text-slate-500 font-medium">Service</span>
            <span className="font-extrabold text-slate-900">{booking.serviceTitle}</span>
          </div>

          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
            <span className="text-slate-500 font-medium">Assigned Pro</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-extrabold text-slate-900">{booking.provider.name}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
            <span className="text-slate-500 font-medium">Schedule Window</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-bold text-slate-900">{booking.scheduledTime}</span>
            </div>
          </div>

          {/* Doorstep Arrival OTP Box */}
          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-900 block tracking-wider">
                  Doorstep Arrival OTP
                </span>
                <span className="text-[10px] text-slate-500">
                  Share upon service provider arrival
                </span>
              </div>
            </div>
            <span className="font-mono text-base font-black text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
              {booking.otpCode}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Button
            fullWidth
            size="lg"
            onClick={() => navigate(`/customer/tracking/${booking.id}`)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="bg-[#071A36] hover:bg-blue-600 text-white font-bold shadow-xs py-3.5"
          >
            Track Service Provider Live
          </Button>

          <Button
            fullWidth
            variant="outline"
            size="md"
            onClick={() => navigate(`/customer/payment-handoff/${booking.id}`)}
            className="text-xs font-semibold"
          >
            Payment Handoff Overview
          </Button>
        </div>
      </div>
    </div>
  );
};
