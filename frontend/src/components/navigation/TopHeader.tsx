import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Globe, User, ArrowLeftRight, LogOut, MapPin, ChevronDown, Loader2 } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { useGeolocation } from '../../hooks/useGeolocation';
import { LanguageSelectorModal } from './LanguageSelectorModal';

interface TopHeaderProps {
  showBack?: boolean;
  backTitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = () => {
  const { currentRole, selectedLanguage, user, logout } = useApp();
  const [langModalOpen, setLangModalOpen] = useState(false);
  const navigate = useNavigate();

  const geo = useGeolocation({ autoReverseGeocode: true });

  const customerNav = [
    { to: '/customer', label: 'Home', end: true, action: 'NAVIGATE_HOME' },
    { to: '/customer/providers', label: 'Find Service Providers', action: 'NAVIGATE_PROVIDERS' },
    { to: '/customer/bookings', label: 'Bookings', action: 'NAVIGATE_BOOKINGS' },
    { to: '/customer/express', label: 'Request Service', action: 'EXPRESS_NEED' },
    { to: '/customer/profile', label: 'Profile', action: 'NAVIGATE_PROFILE' },
  ];

  const technicianNav = [
    { to: '/technician', label: 'Overview', end: true, action: 'NAVIGATE_HOME' },
    { to: '/technician/jobs', label: 'Active Jobs', action: 'NAVIGATE_JOBS' },
    { to: '/technician/earnings', label: 'Earnings', action: 'NAVIGATE_EARNINGS' },
    { to: '/technician/profile', label: 'Profile', action: 'NAVIGATE_PROFILE' },
  ];

  const navLinks = currentRole === 'TECHNICIAN' ? technicianNav : customerNav;

  // Determine current display locality
  const currentLocality =
    geo.area ||
    geo.city ||
    (user.customerProfile?.savedAddresses && user.customerProfile.savedAddresses[0]?.label) ||
    'Adyar, Chennai';

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Left Group: Logo, Tagline & Location Chip */}
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              to={currentRole === 'TECHNICIAN' ? '/technician' : '/customer'}
              className="flex items-center gap-2.5 focus-ring rounded-xl shrink-0 group transition-transform active:scale-98"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B192C] to-[#1E3A8A] flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0 select-none group-hover:from-blue-600 group-hover:to-blue-700 transition-all">
                N
              </div>
              <div className="text-left">
                <span className="text-base font-black tracking-tight text-[#071A36] block leading-none">
                  NEXDO
                </span>
                <span className="text-[10px] font-medium text-slate-500 block mt-0.5 tracking-tight">
                  Just say what you need
                </span>
              </div>
            </Link>

            {/* Location Selector Chip (Urban Company Hallmark) */}
            {currentRole === 'CUSTOMER' && (
              <button
                type="button"
                onClick={() => geo.getCurrentLocation()}
                title="Tap to update location via GPS"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-blue-50/80 border border-slate-200/90 hover:border-blue-200 text-xs text-slate-700 transition-all cursor-pointer focus-ring select-none"
              >
                {geo.loading ? (
                  <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
                <span className="font-bold text-[#071A36] max-w-[140px] truncate">
                  {geo.loading ? 'Detecting...' : currentLocality}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            )}

            {currentRole && (
              <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase select-none ${
                currentRole === 'CUSTOMER'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
              }`}>
                {currentRole === 'CUSTOMER' ? 'Customer' : 'Service Provider'}
              </span>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                data-voice-action={item.action}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-ring ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Controls: Language, Switch Role, Profile, Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language Selector */}
            <button
              onClick={() => setLangModalOpen(true)}
              data-voice-action="SWITCH_LANGUAGE"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/90 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors focus-ring cursor-pointer select-none"
              title="Select Language / மொழி"
              aria-label="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">{selectedLanguage.name}</span>
              <span className="sm:hidden text-[11px] font-bold">
                {selectedLanguage.code === 'ta' ? 'தமிழ்' : 'EN'}
              </span>
            </button>

            {/* Switch Role Button */}
            <button
              onClick={() => navigate('/select-role')}
              data-voice-action={currentRole === 'CUSTOMER' ? 'SWITCH_ROLE_TECHNICIAN' : 'SWITCH_ROLE_CUSTOMER'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 transition-colors focus-ring cursor-pointer select-none"
              title="Switch between Customer and Service Provider mode"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Switch Role</span>
            </button>

            {/* Profile Avatar */}
            <Link
              to={currentRole === 'TECHNICIAN' ? '/technician/profile' : '/customer/profile'}
              data-voice-action="NAVIGATE_PROFILE"
              className="flex items-center p-0.5 rounded-full hover:ring-2 hover:ring-blue-300 focus-ring shrink-0"
              aria-label="View Profile"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs border border-blue-200 overflow-hidden shadow-2xs">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={[user.firstName, user.lastName].filter(Boolean).join(' ') || user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5 text-blue-700" />
                )}
              </div>
            </Link>

            {/* Logout Button */}
            <button
              onClick={async () => {
                await logout();
                navigate('/', { replace: true });
              }}
              data-voice-action="LOGOUT"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-200/80 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 transition-colors focus-ring cursor-pointer select-none"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <LanguageSelectorModal isOpen={langModalOpen} onClose={() => setLangModalOpen(false)} />
    </>
  );
};

