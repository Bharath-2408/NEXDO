import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserRole, CustomerProfile, TechnicianProfile } from '../types/account';
import { LanguageMetadata } from '../types/languages';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { nexdoApi } from '../api/nexdoApi';

export const EMPTY_GUEST_USER: UserAccount = {
  id: '',
  name: 'Guest User',
  phone: '',
  email: '',
  createdAt: new Date().toISOString(),
  customerProfile: {
    id: '',
    name: 'Guest Customer',
    phone: '',
    address: '',
    city: 'Chennai',
    district: 'Chennai District, Tamil Nadu',
    pincode: '600001',
    preferredLanguage: 'ta',
    voiceAutoConfirm: false,
    savedAddresses: [],
  },
  technicianProfile: {
    id: '',
    firstName: 'Guest',
    lastName: 'Service Provider',
    name: 'Guest Service Provider',
    phone: '',
    address: '',
    city: 'Chennai',
    district: 'Chennai District, Tamil Nadu',
    pincode: '600001',
    capabilities: [],
    serviceAreas: [],
    radiusKm: 8,
    experienceYears: 0,
    rating: 5.0,
    completedJobsCount: 0,
    verificationStatus: 'PENDING',
    availabilityStatus: 'OFFLINE',
    activeSubscription: null,
    languagesSpoken: ['Tamil', 'English'],
  },
};

interface ToastInfo {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppContextType {
  user: UserAccount;
  currentRole: UserRole | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  selectedLanguage: LanguageMetadata;
  toast: ToastInfo | null;
  selectRole: (role: UserRole) => void;
  setLanguage: (code: string) => void;
  updateCustomerProfile: (data: Partial<CustomerProfile>) => void;
  updateTechnicianProfile: (data: Partial<TechnicianProfile>) => void;
  setAuthenticatedUser: (authUser: any, profile?: any) => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  clearToast: () => void;
  logout: () => Promise<void>;
  logoutToRoleSelect: () => void;
  saveLastAuthorizedPage: (role: UserRole, path: string) => void;
  getLastAuthorizedPage: (role: UserRole) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount>(EMPTY_GUEST_USER);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [selectedLanguage, setSelectedLanguageState] = useState<LanguageMetadata>(
    SUPPORTED_LANGUAGES.find((l) => l.code === 'ta') || SUPPORTED_LANGUAGES[0]
  );
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const setAuthenticatedUser = (authUser: any, profile?: any) => {
    setIsAuthenticated(true);
    const resolvedRole: UserRole = authUser.role === 'TECHNICIAN' ? 'TECHNICIAN' : 'CUSTOMER';
    setCurrentRole(resolvedRole);

    const rawFull =
      profile?.full_name ||
      profile?.name ||
      authUser.name ||
      (authUser.first_name && authUser.last_name
        ? `${authUser.first_name} ${authUser.last_name}`.trim()
        : '') ||
      'User';
    const splitParts = String(rawFull).trim().split(/\s+/);
    const resolvedFirstName =
      profile?.first_name ||
      authUser.first_name ||
      authUser.firstName ||
      splitParts[0] ||
      '';
    const resolvedLastName =
      profile?.last_name !== undefined && profile?.last_name !== null
        ? profile.last_name
        : authUser.last_name !== undefined && authUser.last_name !== null
        ? authUser.last_name
        : authUser.lastName !== undefined
        ? authUser.lastName
        : splitParts.length > 1
        ? splitParts.slice(1).join(' ')
        : '';
    const resolvedFullName =
      resolvedFirstName && resolvedLastName
        ? `${resolvedFirstName} ${resolvedLastName}`.trim()
        : rawFull;

    setUser((prev) => ({
      ...prev,
      id: authUser.id,
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      name: resolvedFullName,
      phone: authUser.phone || prev.phone,
      email: authUser.email || prev.email,
      customerProfile: {
        ...prev.customerProfile,
        id: profile?.id || prev.customerProfile.id || `cp_${authUser.id}`,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        name: resolvedFullName,
        phone: authUser.phone || prev.customerProfile.phone,
        address: profile?.address || prev.customerProfile.address,
        city: profile?.city || prev.customerProfile.city || 'Chennai',
      },
      technicianProfile: {
        ...prev.technicianProfile,
        id: profile?.id || prev.technicianProfile.id || `tp_${authUser.id}`,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        name: resolvedFullName,
        phone: authUser.phone || prev.technicianProfile.phone,
        city: profile?.city || prev.technicianProfile.city || 'Chennai',
        capabilities: profile?.capabilities || (profile?.skills ? profile.skills.map((s: any) => ({
          id: s.id,
          code: s.skill_code || s.code,
          name: s.skill_name || s.name,
          category: s.category || 'General',
          experienceLevel: s.experience_level || 'INTERMEDIATE',
          isCertified: Boolean(s.is_certified),
          active: s.active !== false,
        })) : prev.technicianProfile.capabilities),
      },
    }));
  };

  // Restore authenticated session from backend on mount or browser refresh
  useEffect(() => {
    nexdoApi.auth
      .me()
      .then((res) => {
        if (res?.user) {
          setAuthenticatedUser(res.user, res.profile);
        } else {
          setIsAuthenticated(false);
          setCurrentRole(null);
          setUser(EMPTY_GUEST_USER);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
        setCurrentRole(null);
        setUser(EMPTY_GUEST_USER);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  // Multi-tab logout synchronization via BroadcastChannel & storage events
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('nexdo_auth_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'LOGOUT') {
          setIsAuthenticated(false);
          setCurrentRole(null);
          setUser(EMPTY_GUEST_USER);
          if (
            window.location.pathname.startsWith('/customer') ||
            window.location.pathname.startsWith('/technician')
          ) {
            window.location.href = '/';
          }
        }
      };
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'nexdo_logout_event') {
        setIsAuthenticated(false);
        setCurrentRole(null);
        setUser(EMPTY_GUEST_USER);
        if (
          window.location.pathname.startsWith('/customer') ||
          window.location.pathname.startsWith('/technician')
        ) {
          window.location.href = '/';
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const selectRole = (role: UserRole) => {
    setCurrentRole(role);
    showToast(`Switched to ${role === 'CUSTOMER' ? 'Customer' : 'Service Provider'} mode`, 'info');
  };

  const saveLastAuthorizedPage = (role: UserRole, path: string) => {
    if (typeof window === 'undefined') return;
    try {
      if (role === 'CUSTOMER' && path.startsWith('/customer')) {
        localStorage.setItem('nexdo_last_page_customer', path);
      } else if (role === 'TECHNICIAN' && path.startsWith('/technician')) {
        localStorage.setItem('nexdo_last_page_technician', path);
      }
    } catch {}
  };

  const getLastAuthorizedPage = (role: UserRole): string => {
    if (typeof window === 'undefined') return role === 'TECHNICIAN' ? '/technician' : '/customer';
    try {
      if (role === 'CUSTOMER') {
        const saved = localStorage.getItem('nexdo_last_page_customer');
        if (saved && saved.startsWith('/customer')) return saved;
        return '/customer';
      } else if (role === 'TECHNICIAN') {
        const saved = localStorage.getItem('nexdo_last_page_technician');
        if (saved && saved.startsWith('/technician')) return saved;
        return '/technician';
      }
    } catch {}
    return role === 'TECHNICIAN' ? '/technician' : '/customer';
  };

  const setLanguage = (code: string) => {
    const normalized = code.toLowerCase();
    const lang = SUPPORTED_LANGUAGES.find(
      (l) =>
        l.code.toLowerCase() === normalized ||
        (normalized.startsWith('en') && l.code.toLowerCase().startsWith('en')) ||
        (normalized.startsWith('ta') && l.code.toLowerCase().startsWith('ta'))
    );
    if (lang) {
      setSelectedLanguageState(lang);
      showToast(`Language set to ${lang.name} (${lang.nativeName})`, 'success');
    }
  };

  const updateCustomerProfile = (data: Partial<CustomerProfile>) => {
    setUser((prev) => {
      const nextFirstName =
        data.firstName !== undefined ? data.firstName.trim() : prev.customerProfile.firstName;
      const nextLastName =
        data.lastName !== undefined ? data.lastName.trim() : prev.customerProfile.lastName;
      const nextName =
        data.name ||
        (nextFirstName || nextLastName ? `${nextFirstName || ''} ${nextLastName || ''}`.trim() : prev.name);
      return {
        ...prev,
        firstName: nextFirstName,
        lastName: nextLastName,
        name: nextName,
        phone: data.phone || prev.phone,
        dob: data.dob || prev.dob,
        customerProfile: {
          ...prev.customerProfile,
          ...data,
          firstName: nextFirstName,
          lastName: nextLastName,
          name: nextName,
        },
      };
    });
    showToast('Customer profile updated', 'success');
  };

  const updateTechnicianProfile = (data: Partial<TechnicianProfile>) => {
    setUser((prev) => {
      const nextFirstName =
        data.firstName !== undefined ? data.firstName.trim() : prev.technicianProfile.firstName;
      const nextLastName =
        data.lastName !== undefined ? data.lastName.trim() : prev.technicianProfile.lastName;
      const nextName =
        data.name ||
        (nextFirstName || nextLastName ? `${nextFirstName || ''} ${nextLastName || ''}`.trim() : prev.name);
      return {
        ...prev,
        firstName: nextFirstName,
        lastName: nextLastName,
        name: nextName,
        phone: data.phone || prev.phone,
        dob: data.dob || prev.dob,
        technicianProfile: {
          ...prev.technicianProfile,
          ...data,
          firstName: nextFirstName,
          lastName: nextLastName,
          name: nextName,
        },
      };
    });
    showToast('Service Provider profile updated', 'success');
  };

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
    });
  };

  const clearToast = () => setToast(null);

  const logout = async () => {
    try {
      await nexdoApi.auth.logout();
    } catch {}
    setIsAuthenticated(false);
    setCurrentRole(null);
    setUser(EMPTY_GUEST_USER);

    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('nexdo_auth_channel');
          bc.postMessage({ type: 'LOGOUT', timestamp: Date.now() });
          bc.close();
        }
        localStorage.setItem('nexdo_logout_event', String(Date.now()));
      } catch {}
    }
  };

  const logoutToRoleSelect = () => {
    logout();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        currentRole,
        isAuthenticated,
        isAuthLoading,
        selectedLanguage,
        toast,
        selectRole,
        setLanguage,
        updateCustomerProfile,
        updateTechnicianProfile,
        setAuthenticatedUser,
        showToast,
        clearToast,
        logout,
        logoutToRoleSelect,
        saveLastAuthorizedPage,
        getLastAuthorizedPage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
