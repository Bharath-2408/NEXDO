import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, User, Briefcase, DollarSign, PlusCircle } from 'lucide-react';
import { useApp } from '../../store/AppContext';

export const BottomNavigation: React.FC = () => {
  const { currentRole } = useApp();

  interface NavItem {
    to: string;
    label: string;
    icon: any;
    end?: boolean;
    action: string;
  }

  const customerTabs: NavItem[] = [
    { to: '/customer', label: 'Home', icon: Home, end: true, action: 'NAVIGATE_HOME' },
    { to: '/customer/bookings', label: 'Bookings', icon: Calendar, action: 'NAVIGATE_BOOKINGS' },
    { to: '/customer/express', label: 'Request', icon: PlusCircle, action: 'EXPRESS_NEED' },
    { to: '/customer/profile', label: 'Profile', icon: User, action: 'NAVIGATE_PROFILE' },
  ];

  const technicianTabs: NavItem[] = [
    { to: '/technician', label: 'Requests', icon: Home, end: true, action: 'NAVIGATE_HOME' },
    { to: '/technician/jobs', label: 'My Jobs', icon: Briefcase, action: 'NAVIGATE_JOBS' },
    { to: '/technician/earnings', label: 'Earnings', icon: DollarSign, action: 'NAVIGATE_EARNINGS' },
    { to: '/technician/profile', label: 'Profile', icon: User, action: 'NAVIGATE_PROFILE' },
  ];

  const tabs = currentRole === 'TECHNICIAN' ? technicianTabs : customerTabs;

  return (
    <nav
      aria-label="Main Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-safe shadow-lg"
    >
      <div className="max-w-md mx-auto px-3 h-16 flex items-center justify-around">
        {tabs.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            data-voice-action={item.action}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1.5 px-1 transition-all focus-ring rounded-2xl select-none min-h-[48px] ${
                isActive
                  ? 'text-blue-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`w-9 h-7 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-blue-100/80 text-blue-700' : 'text-slate-500'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold tracking-tight mt-0.5">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

