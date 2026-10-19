import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Calendar, MapPin, Edit3, X, Check, ArrowLeftRight, ShieldCheck, LogOut } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { useVoice } from '../../voice/VoiceContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { VoiceFormFillerCard } from '../../components/voice/VoiceFormFillerCard';

export const CustomerProfilePage: React.FC = () => {
  const { user, updateCustomerProfile, showToast, selectedLanguage, logout } = useApp();
  const { registerPageActionHandler, updateConversationContext } = useVoice();
  const navigate = useNavigate();

  // Strict Read-Only Default State
  const [isEditing, setIsEditing] = useState(false);

  const getInitialNames = () => {
    const fallbackParts = (user.customerProfile.name || '').trim().split(/\s+/);
    const fName = user.customerProfile.firstName || fallbackParts[0] || '';
    const lName = user.customerProfile.lastName ?? fallbackParts.slice(1).join(' ');
    return { fName, lName };
  };

  const initialNames = getInitialNames();
  const [firstName, setFirstName] = useState(initialNames.fName);
  const [lastName, setLastName] = useState(initialNames.lName);
  const [phone, setPhone] = useState(user.customerProfile.phone);
  const [dob, setDob] = useState(user.customerProfile.dob || '');
  const [address, setAddress] = useState(user.customerProfile.address);
  const [district, setDistrict] = useState(user.customerProfile.district);

  const displayFullName =
    [user.customerProfile.firstName, user.customerProfile.lastName].filter(Boolean).join(' ') ||
    user.customerProfile.name;

  const handleStartEdit = () => {
    const { fName, lName } = getInitialNames();
    setFirstName(fName);
    setLastName(lName);
    setPhone(user.customerProfile.phone);
    setDob(user.customerProfile.dob || '');
    setAddress(user.customerProfile.address);
    setDistrict(user.customerProfile.district);
    setIsEditing(true);
  };

  const handleCancel = () => {
    const { fName, lName } = getInitialNames();
    setFirstName(fName);
    setLastName(lName);
    setPhone(user.customerProfile.phone);
    setDob(user.customerProfile.dob || '');
    setAddress(user.customerProfile.address);
    setDistrict(user.customerProfile.district);
    setIsEditing(false);
  };

  const handleVoiceApply = (entities: any) => {
    if (entities.firstName) setFirstName(entities.firstName);
    if (entities.lastName) setLastName(entities.lastName);
    if (entities.name && !entities.firstName) {
      const parts = String(entities.name).trim().split(/\s+/);
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' '));
    }
    if (entities.dob) setDob(entities.dob);
    if (entities.phone) setPhone(entities.phone);
    if (entities.district) setDistrict(entities.district);
    if (entities.address) setAddress(entities.address);
    showToast('Fields autofilled from speech entities', 'success');
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const combinedName = [trimmedFirst, trimmedLast].filter(Boolean).join(' ') || user.customerProfile.name;
    updateCustomerProfile({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      name: combinedName,
      phone,
      dob,
      address,
      district,
    });
    setIsEditing(false);
    showToast('Customer profile updated successfully', 'success');
  };

  const handleSaveRef = React.useRef(handleSave);
  React.useEffect(() => {
    handleSaveRef.current = handleSave;
  });

  React.useEffect(() => {
    updateConversationContext({
      currentScreen: '/customer/profile',
      role: 'customer',
    });

    const unregister = registerPageActionHandler((action) => {
      if (action.type === 'EDIT_PROFILE') {
        handleStartEdit();
        showToast('Profile editing enabled', 'info');
        return true;
      }
      if (action.type === 'CANCEL_EDIT') {
        handleCancel();
        showToast('Profile edit cancelled', 'info');
        return true;
      }
      if (action.type === 'SAVE_PROFILE') {
        handleSaveRef.current();
        return true;
      }
      if (action.type === 'FILL_FORM_FIELD') {
        handleVoiceApply(action.payload);
        return true;
      }
      return false;
    });

    return unregister;
  }, [registerPageActionHandler, updateConversationContext, showToast]);

  return (
    <div className="max-w-2xl mx-auto text-left space-y-6 pb-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#071A36]">Customer Profile</h2>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
              Verified Account
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Your personal credentials, address, and voice preferences.</p>
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
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await logout();
              navigate('/', { replace: true });
            }}
            leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-500" />}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* READ-ONLY VIEW (DEFAULT) */}
      {!isEditing ? (
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-800 font-extrabold text-lg flex items-center justify-center border border-blue-200 shrink-0">
              {displayFullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-[#0A2540]">{displayFullName}</h3>
              <p className="text-xs text-slate-500 font-mono">{user.customerProfile.phone}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Single NEXDO Account Active
                </span>
              </div>
            </div>
          </div>

          {/* Details Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Personal Information</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">First Name</span>
                  <span className="text-sm font-semibold text-slate-800">{initialNames.fName || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block">Last Name</span>
                  <span className="text-sm font-semibold text-slate-800">{initialNames.lName || '—'}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Date of Birth</span>
                <span className="text-sm font-semibold text-slate-800">{user.customerProfile.dob || '24/08/2007'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Details</h4>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Primary Mobile Phone</span>
                <span className="text-sm font-semibold text-slate-800">{user.customerProfile.phone}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Preferred Conversation Language</span>
                <span className="text-sm font-semibold text-slate-800">{selectedLanguage.name} ({selectedLanguage.nativeName})</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Saved Service Address</h4>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-semibold text-slate-800 block">{user.customerProfile.address}</span>
                <span className="text-xs text-slate-500">{user.customerProfile.district}, Tamil Nadu, India</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center">
            <Button variant="outline" size="sm" onClick={handleStartEdit} leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
              Modify Profile Information
            </Button>
          </div>
        </div>
      ) : (
        /* EDIT MODE (ONLY AFTER CLICKING EDIT PROFILE) */
        <div className="space-y-4">
          <VoiceFormFillerCard onApplyFields={handleVoiceApply} />

          <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#0A2540]">Update Customer Information</h3>
              <span className="text-xs text-slate-400">All fields validated</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Last Name"
                placeholder="Enter your last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                label="Phone Number"
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
                label="District / State"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>

            <Input
              label="Street Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4" />}
              required
            />

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
