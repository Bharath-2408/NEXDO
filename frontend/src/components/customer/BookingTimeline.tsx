import React from 'react';
import { CheckCircle2, Clock, Wrench, ShieldCheck, QrCode, KeyRound, Check } from 'lucide-react';
import { BookingStatus } from '../../types/customer';

interface BookingTimelineProps {
  currentStatus: BookingStatus;
  diagnosisOtp?: string;
  finalOtp?: string;
  isEstimateApproved?: boolean;
  isPaymentDone?: boolean;
}

export const BookingTimeline: React.FC<BookingTimelineProps> = ({
  currentStatus,
  diagnosisOtp,
  finalOtp,
  isEstimateApproved,
  isPaymentDone,
}) => {
  const steps: {
    statusKey: BookingStatus;
    title: string;
    description: string;
    icon: any;
    meta?: string;
  }[] = [
    {
      statusKey: 'ACCEPTED',
      title: 'Technician Assigned',
      description: 'Verified professional accepted your service request',
      icon: ShieldCheck,
    },
    {
      statusKey: 'TECHNICIAN_ON_THE_WAY',
      title: 'Technician En Route',
      description: 'Navigating to your doorstep with live GPS coordinate feed',
      icon: Clock,
    },
    {
      statusKey: 'ARRIVED',
      title: 'Arrived at Doorstep',
      description: 'Technician is at your location',
      icon: CheckCircle2,
    },
    {
      statusKey: 'DIAGNOSING',
      title: 'Diagnosis & Inspection',
      description: 'Physical inspection (Standard Diagnosis Fee ₹149)',
      icon: Wrench,
      meta: diagnosisOtp ? `Diagnosis OTP: ${diagnosisOtp}` : undefined,
    },
    {
      statusKey: 'APPROVED',
      title: 'Estimate Approved',
      description: 'Itemized quotation (₹700 parts + ₹400 labour = ₹1,100 locked)',
      icon: Check,
      meta: isEstimateApproved ? 'Price Locked at ₹1,100' : 'Awaiting Approval',
    },
    {
      statusKey: 'WORK_IN_PROGRESS',
      title: 'Execution & Repair',
      description: 'Active technician repair adhering to safety protocol',
      icon: Wrench,
    },
    {
      statusKey: 'PAYMENT_RECEIVED',
      title: 'NEXDO Payment',
      description: 'Direct transaction-specific QR payment (Sandbox Mode)',
      icon: QrCode,
      meta: isPaymentDone ? 'Paid ₹1,100' : 'Pending Handoff',
    },
    {
      statusKey: 'COMPLETED',
      title: 'Job Completed',
      description: 'Final completion OTP verified and technician credited',
      icon: KeyRound,
      meta: finalOtp ? `Final OTP: ${finalOtp}` : undefined,
    },
  ];

  const stateWeight: Record<BookingStatus, number> = {
    REQUESTED: 0,
    MATCHING: 0.5,
    TECHNICIAN_SELECTED: 0.8,
    PENDING_CONFIRMATION: 0.9,
    MATCHED: 1,
    ACCEPTED: 1,
    CONFIRMED: 1,
    TECHNICIAN_ON_THE_WAY: 2,
    EN_ROUTE: 2,
    ARRIVED: 3,
    DIAGNOSING: 4,
    ESTIMATE_PENDING: 4.5,
    APPROVED: 5,
    WORK_IN_PROGRESS: 6,
    IN_PROGRESS: 6,
    PAYMENT_PENDING: 6.5,
    PAYMENT_RECEIVED: 7,
    OTP_PENDING: 7.5,
    COMPLETED: 8,
    CANCELLED: -1,
  };

  const currentWeight = stateWeight[currentStatus] ?? 0;

  return (
    <div className="w-full text-left py-2">
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const stepWeight = stateWeight[step.statusKey];
          const isDone = currentWeight >= stepWeight;
          const isCurrent =
            currentStatus === step.statusKey ||
            (step.statusKey === 'DIAGNOSING' && currentStatus === 'ESTIMATE_PENDING') ||
            (step.statusKey === 'PAYMENT_RECEIVED' && currentStatus === 'PAYMENT_PENDING') ||
            (step.statusKey === 'COMPLETED' && currentStatus === 'OTP_PENDING');

          const StepIcon = step.icon;

          return (
            <div key={step.statusKey} className="flex items-start gap-3 relative">
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-3.5 top-8 bottom-0 w-0.5 transition-colors ${
                    isDone ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}

              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                  isDone
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600 ring-offset-1'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <StepIcon className="w-3.5 h-3.5" />
                )}
              </div>

              <div className="min-w-0 pt-0.5 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-xs font-bold leading-tight ${
                      isDone ? 'text-[#071A36]' : isCurrent ? 'text-blue-700 font-extrabold' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </p>
                  {isCurrent && (
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-blue-100 text-blue-800 animate-pulse">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{step.description}</p>
                {step.meta && (
                  <div className="mt-1 inline-block px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-semibold text-slate-700 border border-slate-200">
                    {step.meta}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
