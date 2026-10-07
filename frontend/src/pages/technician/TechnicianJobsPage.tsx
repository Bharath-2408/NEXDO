import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Play,
  Navigation,
  Wrench,
  Lock,
  QrCode,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useTechnician } from '../../store/TechnicianContext';
import { useApp } from '../../store/AppContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tabs } from '../../components/ui/Tabs';

export const TechnicianJobsPage: React.FC = () => {
  const {
    activeBooking,
    acceptedJobs,
    advanceTechnicianStep,
    verifyDiagnosisOtp,
    createEstimate,
    startWork,
    finishWork,
    verifyFinalOtp,
  } = useTechnician();
  const { showToast } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Input states for OTPs and Estimate
  const [diagnosisOtpInput, setDiagnosisOtpInput] = useState('4821');
  const [finalOtpInput, setFinalOtpInput] = useState('8942');
  const [estimateParts, setEstimateParts] = useState(700);
  const [estimateLabour, setEstimateLabour] = useState(400);
  const [estimateDesc, setEstimateDesc] = useState('Capacitor replacement and wiring repair');

  const currentBooking = activeBooking;
  const isCompleted = currentBooking?.status === 'COMPLETED';

  const tabs = [
    { id: 'active', label: 'Active Execution', badge: currentBooking && !isCompleted ? 1 : 0 },
    { id: 'history', label: 'Completed Jobs', badge: isCompleted ? 1 : 0 },
  ];

  return (
    <div className="text-left space-y-5 pb-8">
      <div>
        <h2 className="text-2xl font-extrabold text-[#071A36]">Technician Job Execution</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-world operational coordination: Journey → Inspection OTP → Locked Estimate → QR Payment → Final OTP.
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />

      {activeTab === 'active' && currentBooking && !isCompleted && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-5">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                  {currentBooking.status}
                </span>
                <span className="text-xs font-mono text-slate-400">Ref: {currentBooking.referenceCode}</span>
              </div>
              <h3 className="text-xl font-extrabold text-[#071A36] mt-1">
                {currentBooking.serviceTitle}
              </h3>
            </div>

            <a
              href={`tel:${currentBooking.customerPhone}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors w-fit"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Customer</span>
            </a>
          </div>

          {/* Customer & Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer</span>
              <span className="font-bold text-slate-900 mt-0.5 block">{currentBooking.customerName}</span>
              <span className="text-[11px] text-slate-500">{currentBooking.customerPhone}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Address</span>
              <span className="font-medium text-slate-700 mt-0.5 block">{currentBooking.address}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {currentBooking.serviceMode === 'SERVICE'
                  ? 'Customer Request'
                  : currentBooking.estimate?.isApproved ? 'Approved Payout' : 'Diagnosis Fee'}
              </span>
              <span className="text-sm font-black text-emerald-700 mt-0.5 block">
                {currentBooking.serviceMode === 'SERVICE'
                  ? (currentBooking.estimate?.isApproved ? `₹${currentBooking.estimate.total}` : 'Service / Repair requested')
                  : `₹${currentBooking.estimate?.isApproved ? currentBooking.estimate.total : (currentBooking.diagnosis?.fee || 149)} (100%)`}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Zero Commission</span>
            </div>
          </div>

          {/* OPERATIONAL STEP CONTROLS (12-State Real World Stepper) */}

          {/* Step 1: ACCEPTED -> Start Journey */}
          {currentBooking.status === 'ACCEPTED' && (
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-3">
              <div className="flex items-center gap-2 text-blue-900 text-xs font-bold uppercase tracking-wider">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>Next Action: Journey Start</span>
              </div>
              <p className="text-xs text-slate-600">
                You have accepted this job. Tap below when you start driving to the customer's location to notify them of your arrival ETA.
              </p>
              <Button
                fullWidth
                size="lg"
                data-voice-action="MARK_ON_THE_WAY"
                onClick={() => {
                  advanceTechnicianStep(currentBooking.id, 'TECHNICIAN_ON_THE_WAY');
                  showToast('Journey started! Customer notified.', 'info');
                }}
                className="bg-[#071A36] hover:bg-blue-600 text-white font-bold"
                leftIcon={<Navigation className="w-4 h-4" />}
              >
                Start Journey (On the Way)
              </Button>
            </div>
          )}

          {/* Step 2: TECHNICIAN_ON_THE_WAY -> Mark Arrived */}
          {currentBooking.status === 'TECHNICIAN_ON_THE_WAY' && (
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-3">
              <div className="flex items-center gap-2 text-blue-900 text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Next Action: Doorstep Arrival</span>
              </div>
              <p className="text-xs text-slate-600">
                Mark your arrival once you reach the customer's address to initiate the service phase.
              </p>
              <Button
                fullWidth
                size="lg"
                data-voice-action="MARK_ARRIVED"
                onClick={() => {
                  advanceTechnicianStep(currentBooking.id, 'ARRIVED');
                  showToast('Marked arrived at customer doorstep.', 'success');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Mark Arrived at Doorstep
              </Button>
            </div>
          )}

          {/* Step 3: ARRIVED / DIAGNOSING -> Diagnosis OTP or Direct Service Estimate */}
          {(currentBooking.status === 'ARRIVED' || currentBooking.status === 'DIAGNOSING') && (
            currentBooking.serviceMode === 'SERVICE' ? (
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#071A36] text-xs font-bold uppercase tracking-wider">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <span>Customer Request: Service / Repair</span>
                  </div>
                  <span className="text-xs font-bold text-blue-700">No Diagnosis Fee</span>
                </div>
                <p className="text-xs text-slate-600">
                  Customer directly requested Service / Repair. Inspect the required repair and provide an itemized estimate.
                </p>
                <Button
                  fullWidth
                  size="lg"
                  onClick={() => {
                    advanceTechnicianStep(currentBooking.id, 'ESTIMATE_PENDING');
                    showToast('Ready to submit itemized estimate.', 'info');
                  }}
                  className="bg-[#071A36] hover:bg-blue-600 text-white font-bold"
                >
                  Provide Itemized Service Estimate
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#071A36] text-xs font-bold uppercase tracking-wider">
                    <Wrench className="w-4 h-4 text-blue-600" />
                    <span>Step: Verify Diagnosis OTP</span>
                  </div>
                  <span className="text-xs font-bold text-blue-600">Diagnosis Fee: ₹149</span>
                </div>
                <p className="text-xs text-slate-600">
                  Ask customer for their 4-digit Diagnosis OTP (default test: <code className="font-mono bg-white px-1.5 py-0.5 rounded border">4821</code>) to verify arrival and begin inspection.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={diagnosisOtpInput}
                    onChange={(e) => setDiagnosisOtpInput(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-lg font-mono font-bold tracking-widest text-[#071A36] w-32 focus-ring"
                  />
                  <Button
                    size="md"
                    onClick={() => {
                      const ok = verifyDiagnosisOtp(currentBooking.id, diagnosisOtpInput);
                      if (ok) {
                        showToast('Diagnosis OTP verified! You can now submit estimate.', 'success');
                      } else {
                        showToast('Invalid OTP. Expected 4821.', 'error');
                      }
                    }}
                    className="flex-1 bg-[#071A36] hover:bg-blue-600 text-white font-bold"
                  >
                    Verify Diagnosis OTP
                  </Button>
                </div>
              </div>
            )
          )}

          {/* Step 4: ESTIMATE_PENDING -> Create / View Quotation */}
          {currentBooking.status === 'ESTIMATE_PENDING' && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>Step: Itemized Estimate Submission</span>
                </div>
                <span className="text-xs font-extrabold text-amber-800">Total: ₹{estimateParts + estimateLabour}</span>
              </div>
              <p className="text-xs text-slate-600">
                Enter required parts and labour. Once submitted, customer will approve and the price will be permanently locked.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Parts Cost (₹)"
                  type="number"
                  value={estimateParts}
                  onChange={(e) => setEstimateParts(Number(e.target.value))}
                />
                <Input
                  label="Labour Cost (₹)"
                  type="number"
                  value={estimateLabour}
                  onChange={(e) => setEstimateLabour(Number(e.target.value))}
                />
              </div>

              <Input
                label="Diagnosis Findings / Replaced Parts"
                value={estimateDesc}
                onChange={(e) => setEstimateDesc(e.target.value)}
              />

              <Button
                fullWidth
                size="lg"
                onClick={() => {
                  createEstimate(currentBooking.id, estimateParts, estimateLabour, estimateDesc);
                  showToast('Quotation submitted! Waiting for customer approval.', 'info');
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                Submit Itemized Estimate (₹{estimateParts + estimateLabour})
              </Button>
            </div>
          )}

          {/* Step 5: APPROVED -> Start Work */}
          {currentBooking.status === 'APPROVED' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Estimate Approved & Locked</span>
                </div>
                <span className="text-xs font-black text-emerald-800">₹{currentBooking.estimate?.total || 1100}</span>
              </div>
              <p className="text-xs text-slate-600">
                Customer has approved the estimate. The price is strictly locked at ₹{currentBooking.estimate?.total || 1100}. You can now execute the repair.
              </p>
              <Button
                fullWidth
                size="lg"
                data-voice-action="START_WORK"
                onClick={() => {
                  startWork(currentBooking.id);
                  showToast('Work started!', 'success');
                }}
                className="bg-[#071A36] hover:bg-blue-600 text-white font-bold"
                leftIcon={<Play className="w-4 h-4" />}
              >
                Start Repair Execution
              </Button>
            </div>
          )}

          {/* Step 6: WORK_IN_PROGRESS -> Finish & Generate QR */}
          {(currentBooking.status === 'WORK_IN_PROGRESS' || currentBooking.status === 'IN_PROGRESS') && (
            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-900 text-xs font-bold uppercase tracking-wider">
                  <Wrench className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>Execution in Progress</span>
                </div>
                <span className="text-xs font-bold text-slate-500">Locked: ₹{currentBooking.estimate?.total || 1100}</span>
              </div>
              <p className="text-xs text-slate-600">
                Perform testing and cleanup. When finished, tap below to generate the transaction-specific NEXDO QR on your screen for customer payment.
              </p>
              <Button
                fullWidth
                size="lg"
                data-voice-action="GENERATE_PAYMENT_QR"
                onClick={() => {
                  finishWork(currentBooking.id);
                  showToast('Repair finished! NEXDO Payment QR generated.', 'success');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                leftIcon={<QrCode className="w-4 h-4" />}
              >
                Complete Work & Generate NEXDO Payment QR
              </Button>
            </div>
          )}

          {/* Step 7: PAYMENT_PENDING -> Display NEXDO QR Code */}
          {currentBooking.status === 'PAYMENT_PENDING' && (
            <div className="p-5 rounded-2xl bg-slate-900 text-white text-center space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold uppercase tracking-wider text-sky-400">Transaction-Specific NEXDO QR</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  [SANDBOX MODE]
                </span>
              </div>

              {/* QR Display Card */}
              <div className="max-w-[200px] mx-auto p-4 bg-white rounded-2xl border-2 border-dashed border-sky-400 shadow-md">
                <div className="aspect-square bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-between text-white relative">
                  <div className="w-full flex justify-between">
                    <div className="w-6 h-6 border-4 border-white bg-slate-900 rounded-sm" />
                    <div className="w-6 h-6 border-4 border-white bg-slate-900 rounded-sm" />
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] font-black tracking-widest text-sky-400">NEXDO</span>
                    <div className="text-[8px] font-mono text-slate-300">TXN_{currentBooking.referenceCode}</div>
                  </div>
                  <div className="w-full flex justify-between">
                    <div className="w-6 h-6 border-4 border-white bg-slate-900 rounded-sm" />
                    <div className="w-6 h-6 bg-sky-400 rounded-sm" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-800 block mt-2">
                  Amount: ₹{currentBooking.estimate?.total || 1100}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                Present this screen to the customer. When paid via their device, status updates to Payment Received.
              </p>

              <Button
                fullWidth
                size="md"
                onClick={() => {
                  advanceTechnicianStep(currentBooking.id, 'PAYMENT_RECEIVED');
                  showToast('Payment received! Request customer for Final OTP.', 'success');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Simulate Payment Received (Sandbox)
              </Button>
            </div>
          )}

          {/* Step 8: PAYMENT_RECEIVED / OTP_PENDING -> Final Completion OTP */}
          {(currentBooking.status === 'PAYMENT_RECEIVED' || currentBooking.status === 'OTP_PENDING') && (
            <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-950 text-xs font-bold uppercase tracking-wider">
                  <KeyRound className="w-4 h-4 text-emerald-700" />
                  <span>Final Step: Verify Completion OTP</span>
                </div>
                <span className="text-xs font-black text-emerald-800">
                  Payout: ₹{currentBooking.estimate?.total || 1100}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Ask customer for their 4-digit Final Completion OTP (default test: <code className="font-mono bg-white px-1.5 py-0.5 rounded border">8942</code>) to finalize the job and credit your earnings.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={finalOtpInput}
                  onChange={(e) => setFinalOtpInput(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-center text-lg font-mono font-bold tracking-widest text-[#071A36] w-32 focus-ring"
                />
                <Button
                  size="md"
                  onClick={() => {
                    const ok = verifyFinalOtp(currentBooking.id, finalOtpInput);
                    if (ok) {
                      showToast('Final OTP verified! ₹1,100 credited to your wallet with ₹0 platform commission.', 'success');
                    } else {
                      showToast('Invalid OTP. Expected 8942.', 'error');
                    }
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Verify Final OTP & Release Payout
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* When no active ongoing job */}
      {activeTab === 'active' && (!currentBooking || isCompleted) && (
        <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No active job currently in execution</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Check the Overview tab for new broadcasted customer requests matching your capabilities.
          </p>
          <Button
            size="sm"
            onClick={() => navigate('/technician')}
            className="mt-4 bg-[#071A36] text-white"
          >
            Go to Requests Overview
          </Button>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {isCompleted && currentBooking && (
            <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Service Completed
                  </span>
                  <h3 className="text-base font-extrabold text-[#071A36]">{currentBooking.serviceTitle}</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  COMPLETED
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Customer</span>
                  <span className="font-bold text-slate-800">{currentBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Date</span>
                  <span className="font-bold text-slate-800">Today</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Payout Credited</span>
                  <span className="font-extrabold text-emerald-700">
                    ₹{currentBooking.estimate?.total || 1100} (100%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {acceptedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 text-xs flex justify-between items-center"
            >
              <div>
                <h4 className="font-bold text-slate-800">{job.serviceName}</h4>
                <p className="text-slate-400">{job.customerNameMasked} · {job.category}</p>
              </div>
              <span className="font-extrabold text-emerald-700">
                {job.approvedRepairAmount ? `₹${job.approvedRepairAmount}` : `Diagnosis ₹${job.diagnosisFee || 149}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
