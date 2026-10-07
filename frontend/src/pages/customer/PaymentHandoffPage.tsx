import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  CreditCard,
  Smartphone,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  UserCheck,
  QrCode,
  KeyRound,
} from 'lucide-react';
import { useCustomer } from '../../store/CustomerContext';
import { useVoice } from '../../voice/VoiceContext';
import { useApp } from '../../store/AppContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export type PaymentMethod = 'QR' | 'UPI' | 'CARD';
export type PaymentStatus = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export const PaymentHandoffPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { bookings, processPayment } = useCustomer();
  const { showToast } = useApp();
  const { registerPageActionHandler, updateConversationContext } = useVoice();
  const navigate = useNavigate();

  const booking = bookings.find((b) => b.id === bookingId) || bookings[0];
  const payableAmount = booking?.estimate?.total || booking?.estimatedPrice || 1100;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('QR');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('IDLE');

  // Form Fields
  const [upiId, setUpiId] = useState('user@okhdfcbank');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'GPAY' | 'PHONEPE' | 'PAYTM'>('GPAY');

  const handlePay = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPaymentStatus('PROCESSING');

    // Simulate payment gateway handshake
    setTimeout(() => {
      processPayment(booking.id, selectedMethod);
      setPaymentStatus('SUCCESS');
      showToast(`Payment of ₹${payableAmount} authorized successfully!`, 'success');
    }, 1200);
  };

  const handlePayRef = React.useRef(handlePay);
  React.useEffect(() => {
    handlePayRef.current = handlePay;
  });

  React.useEffect(() => {
    updateConversationContext({
      currentScreen: `/customer/payment/${booking.id}`,
      activeBooking: {
        id: booking.id,
        service: booking.serviceTitle,
        amount: payableAmount,
      },
    });

    const unregister = registerPageActionHandler((action) => {
      if (action.type === 'SELECT_PAYMENT_METHOD') {
        const m = (action.payload?.method || '').toUpperCase();
        if (m === 'QR' || m === 'UPI' || m === 'CARD') {
          setSelectedMethod(m as PaymentMethod);
          showToast(`Selected payment method: ${m}`, 'info');
          return true;
        }
      }
      if (action.type === 'CONFIRM_PAYMENT' || action.type === 'PAY_DIAGNOSIS' || action.type === 'COMPLETE_PAYMENT') {
        handlePayRef.current();
        return true;
      }
      if (action.type === 'NAVIGATE_BACK' || action.type === 'GO_BACK') {
        navigate(`/customer/tracking/${booking.id}`);
        return true;
      }
      return false;
    });

    return unregister;
  }, [booking, payableAmount, registerPageActionHandler, updateConversationContext, showToast, navigate]);

  const handleRetry = () => {
    setPaymentStatus('IDLE');
  };

  return (
    <div className="w-full text-left space-y-6 pb-8">
      {/* Back link */}
      <button
        onClick={() => navigate(`/customer/tracking/${booking.id}`)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Live Tracking</span>
      </button>

      {/* Prominent Sandbox Notice */}
      <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 text-[10px] font-extrabold uppercase tracking-wider">
            [SANDBOX / TEST MODE]
          </span>
          <p className="text-xs text-amber-900 font-medium">
            Simulated payment sandbox for testing. No real bank charges or credentials are used.
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-amber-800 shrink-0">ENV: STAGING</span>
      </div>

      {/* Main Payment Section: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (lg:col-span-7): Payment Forms or Status States */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs">
          {paymentStatus === 'SUCCESS' ? (
            /* SUCCESS STATE */
            <div className="text-center py-6 space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                  Payment Authorized (Sandbox)
                </span>
                <h2 className="text-2xl font-black text-[#071A36] mt-1">
                  ₹{payableAmount} Received
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  Ref: TXN_NEX_{booking.referenceCode} · Method: {selectedMethod}
                </p>
              </div>

              {/* Reveal Customer Final Completion OTP */}
              <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-400 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wider">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>Your Final Completion OTP</span>
                </div>
                <div className="text-3xl font-black text-[#071A36] tracking-widest font-mono select-all">
                  {booking.finalOtp?.code || '8942'}
                </div>
                <p className="text-xs text-blue-800 leading-relaxed max-w-sm mx-auto">
                  Provide this 4-digit code to your technician <strong>after verifying</strong> the repair to release their payout.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-2">
                <div className="flex justify-between">
                  <span>Service:</span>
                  <span className="font-semibold text-slate-800">{booking.serviceTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span>Technician:</span>
                  <span className="font-semibold text-slate-800">{booking.provider.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Commission:</span>
                  <span className="font-bold text-emerald-700">₹0 (100% credited to Pro)</span>
                </div>
              </div>

              <Button
                fullWidth
                size="lg"
                onClick={() => navigate(`/customer/tracking/${booking.id}`)}
                className="bg-[#071A36] hover:bg-blue-600 text-white font-bold"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Return to Live Tracking
              </Button>
            </div>
          ) : paymentStatus === 'PROCESSING' ? (
            /* PROCESSING STATE */
            <div className="text-center py-12 space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#071A36]">
                  Simulating Sandbox Payment...
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Authorizing ₹{payableAmount} via test gateway. Please do not close.
                </p>
              </div>
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
            </div>
          ) : paymentStatus === 'FAILED' ? (
            /* FAILED STATE */
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-rose-700">Payment Simulation Error</h3>
                <p className="text-xs text-slate-500 mt-1">
                  The test gateway encountered an error. Please retry.
                </p>
              </div>
              <Button fullWidth onClick={handleRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
                Retry Sandbox Payment
              </Button>
            </div>
          ) : (
            /* PAYMENT SELECTION & METHODS */
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-[#071A36]">Payment Handoff</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select payment mode to authorize ₹{payableAmount}
                </p>
              </div>

              {/* Method Selector Tabs */}
              <div>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('QR')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedMethod === 'QR'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>NEXDO QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('UPI')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedMethod === 'UPI'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Test UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('CARD')}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedMethod === 'CARD'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Test Card</span>
                  </button>
                </div>
              </div>

              {/* 1. NEXDO TRANSACTION-SPECIFIC QR VIEW */}
              {selectedMethod === 'QR' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
                  <div className="max-w-[200px] mx-auto p-4 bg-white rounded-2xl border-2 border-dashed border-blue-400 shadow-xs relative">
                    {/* Simulated Transaction-Specific QR */}
                    <div className="aspect-square bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-between text-white relative">
                      <div className="w-full flex justify-between">
                        <div className="w-6 h-6 border-4 border-white bg-slate-900 rounded-sm" />
                        <div className="w-6 h-6 border-4 border-white bg-slate-900 rounded-sm" />
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-black tracking-widest text-sky-400">NEXDO</span>
                        <div className="text-[8px] font-mono text-slate-300">TXN_{booking.referenceCode}</div>
                      </div>
                      <div className="w-full flex justify-between">
                        <div className="w-6 h-6 border-4 border-white bg-slate-900 rounded-sm" />
                        <div className="w-6 h-6 bg-sky-400 rounded-sm" />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 block mt-2">
                      Scan on Technician Device
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                    This is a transaction-specific NEXDO payment QR generated directly for Booking #{booking.referenceCode}.
                  </p>

                  <Button
                    fullWidth
                    size="lg"
                    onClick={() => handlePay()}
                    className="bg-[#071A36] hover:bg-blue-600 text-white font-bold"
                  >
                    Simulate Customer Scanned & Paid (₹{payableAmount})
                  </Button>
                </div>
              )}

              {/* 2. TEST UPI */}
              {selectedMethod === 'UPI' && (
                <div className="space-y-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-800 block">Sandbox UPI Apps</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['GPAY', 'PHONEPE', 'PAYTM'] as const).map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setSelectedUpiApp(app)}
                        className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          selectedUpiApp === app
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {app === 'GPAY' ? 'Google Pay' : app === 'PHONEPE' ? 'PhonePe' : 'Paytm'}
                      </button>
                    ))}
                  </div>

                  <Input
                    label="Test Virtual Payment Address (VPA)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="testuser@okhdfcbank"
                    leftIcon={<Smartphone className="w-4 h-4" />}
                  />

                  <Button
                    fullWidth
                    size="lg"
                    onClick={() => handlePay()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Authorize Test UPI Payment (₹{payableAmount})
                  </Button>
                </div>
              )}

              {/* 3. TEST CARD */}
              {selectedMethod === 'CARD' && (
                <div className="space-y-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <Input
                    label="Test Card Number"
                    value="4111 •••• •••• 1111"
                    disabled
                    leftIcon={<CreditCard className="w-4 h-4" />}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Expiry Date" value="12/28" disabled />
                    <Input label="CVV" value="•••" disabled />
                  </div>

                  <Button
                    fullWidth
                    size="lg"
                    onClick={() => handlePay()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Authorize Test Card Payment (₹{payableAmount})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (lg:col-span-5): Price Breakdown & Commission Guarantee */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Service Quotation
                </span>
                <h3 className="text-base font-extrabold text-[#071A36]">{booking.serviceTitle}</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Ref: {booking.referenceCode}</span>
            </div>

            {/* Provider Preview */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {booking.provider.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#071A36]">{booking.provider.name}</h4>
                  <p className="text-[11px] text-slate-500">{booking.provider.primaryCapability}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Verified Pro</span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Replacement Parts (Capacitor & Wire):</span>
                <span className="font-semibold text-slate-900">₹{booking.estimate?.parts || 700}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Labour & Fitting:</span>
                <span className="font-semibold text-slate-900">₹{booking.estimate?.labour || 400}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Commission:</span>
                <span className="font-bold text-emerald-700">₹0 (100% to Pro)</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-extrabold text-[#071A36]">
                <span>Total Amount Due:</span>
                <span className="text-lg text-blue-700">₹{payableAmount}</span>
              </div>
            </div>
          </div>

          {/* Zero Commission Architecture Guarantee */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>NEXDO Direct Payout Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-800">
              NEXDO charges 0% platform commission on services. The full ₹{payableAmount} will be credited directly to your technician's wallet upon Final OTP verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
