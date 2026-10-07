import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Calendar, MapPin, Wrench, ShieldCheck, ArrowLeftRight, Edit3, X, Check, Shield } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { useTechnician } from '../../store/TechnicianContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { VoiceFormFillerCard } from '../../components/voice/VoiceFormFillerCard';

export const TechnicianProfilePage: React.FC = () => {
  const { user, updateTechnicianProfile, showToast } = useApp();
  const { capabilities, earnings } = useTechnician();
  const navigate = useNavigate();

  // Strict Read-Only Default State
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [name, setName] = useState(user.technicianProfile.name);
  const [phone, setPhone] = useState(user.technicianProfile.phone);
  const [dob, setDob] = useState(user.technicianProfile.dob || '12/04/1996');
  const [city, setCity] = useState(user.technicianProfile.city);
  const [district, setDistrict] = useState(user.technicianProfile.district);
  const [radiusKm, setRadiusKm] = useState(user.technicianProfile.radiusKm);

  const handleStartEdit = () => {
    setName(user.technicianProfile.name);
    setPhone(user.technicianProfile.phone);
    setDob(user.technicianProfile.dob || '12/04/1996');
    setCity(user.technicianProfile.city);
    setDistrict(user.technicianProfile.district);
    setRadiusKm(user.technicianProfile.radiusKm);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setName(user.technicianProfile.name);
    setPhone(user.technicianProfile.phone);
    setDob(user.technicianProfile.dob || '12/04/1996');
    setCity(user.technicianProfile.city);
    setDistrict(user.technicianProfile.district);
    setRadiusKm(user.technicianProfile.radiusKm);
    setIsEditing(false);
  };

  const handleVoiceApply = (entities: any) => {
    if (entities.name) setName(entities.name);
    if (entities.dob) setDob(entities.dob);
    if (entities.phone) setPhone(entities.phone);
    if (entities.district) setDistrict(entities.district);
    showToast('Technician fields autofilled from speech entities', 'success');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateTechnicianProfile({
      name,
      phone,
      dob,
      city,
      district,
      radiusKm,
    });
    setIsEditing(false);
    showToast('Technician profile updated successfully', 'success');
  };

  return (
    <div className="max-w-2xl mx-auto text-left space-y-6 pb-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#071A36]">Technician Pro Profile</h2>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified Background
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Technician credentials, trade capabilities, and service coverage area.</p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button
              size="sm"
              variant="primary"
              onClick={handleStartEdit}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Edit Profile
            </Button>
          ) : (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              Edit Mode Active
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/select-role')}
            leftIcon={<ArrowLeftRight className="w-3.5 h-3.5" />}
          >
            Switch Persona
          </Button>
        </div>
      </div>

      {/* READ-ONLY VIEW (DEFAULT) */}
      {!isEditing ? (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#0A2540] text-sky-400 font-extrabold text-lg flex items-center justify-center shrink-0">
                {user.technicianProfile.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0A2540]">{user.technicianProfile.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{user.technicianProfile.phone}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="font-semibold text-slate-700">{user.technicianProfile.city}, {user.technicianProfile.district}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-semibold text-blue-700">{capabilities.filter(c => c.active).length} Active Capabilities</span>
                </div>
              </div>
            </div>

            <Button size="sm" variant="secondary" onClick={() => navigate('/technician/subscription')}>
              Pass: {earnings.activeSubscriptionTitle.split(' ')[0]}
            </Button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Professional Credentials</h4>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Technician Name</span>
                <span className="text-sm font-semibold text-slate-800">{user.technicianProfile.name}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Date of Birth</span>
                <span className="text-sm font-semibold text-slate-800">{user.technicianProfile.dob || '12/04/1996'}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Identity & Police Verification</span>
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                  <Shield className="w-3.5 h-3.5" />
                  Completed & Certified
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Service Coverage</h4>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Operational District</span>
                <span className="text-sm font-semibold text-slate-800">{user.technicianProfile.district}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Dispatch Radius</span>
                <span className="text-sm font-semibold text-blue-700">{user.technicianProfile.radiusKm} Kilometers from base</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Platform Commission</span>
                <span className="text-xs font-bold text-emerald-700">0% (You retain 100% customer payouts)</span>
              </div>
            </div>
          </div>

          {/* Active Capabilities Summary */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Registered Capabilities ({capabilities.length})
              </h4>
              <button
                onClick={() => navigate('/technician/capabilities')}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Manage Capabilities →
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {capabilities.map((cap) => (
                <span
                  key={cap.id}
                  className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5"
                >
                  <Wrench className="w-3 h-3 text-slate-400" />
                  <span>{cap.name}</span>
                  <span className="text-[10px] text-blue-600 font-bold">({cap.experienceLevel})</span>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center">
            <Button variant="outline" size="sm" onClick={handleStartEdit} leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
              Edit Technician Information
            </Button>
          </div>
        </div>
      ) : (
        /* EDIT MODE (ONLY AFTER CLICKING EDIT PROFILE) */
        <div className="space-y-4">
          <VoiceFormFillerCard
            title="Voice Technician Profile Setup"
            subtitle="Speak your name, phone, DOB, and district to configure your technician credentials."
            onApplyFields={handleVoiceApply}
          />

          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#0A2540]">Update Technician Credentials</h3>
              <span className="text-xs text-slate-400">All fields validated</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Mobile Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                required
              />

              <Input
                label="Date of Birth"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                leftIcon={<Calendar className="w-4 h-4" />}
              />

              <Input
                label="Base District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>

            {/* Service Coverage Radius Slider */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Service Coverage Radius
                </label>
                <span className="text-xs font-bold text-blue-600">{radiusKm} Kilometers</span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[11px] text-slate-400 block mt-1">
                You will receive eligible opportunities within {radiusKm} km of your base district.
              </span>
            </div>

            {/* Edit Mode Actions: Save Changes & Cancel */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button type="button" variant="outline" size="md" onClick={handleCancel} leftIcon={<X className="w-4 h-4" />}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" leftIcon={<Check className="w-4 h-4" />}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
