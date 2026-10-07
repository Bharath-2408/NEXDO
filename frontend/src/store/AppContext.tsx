import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserRole, CustomerProfile, TechnicianProfile } from '../types/account';
import { LanguageMetadata } from '../types/languages';
import { INITIAL_USER_ACCOUNT } from '../constants/mockData';
import { SUPPORTED_LANGUAGES } from '../constants/languages';
import { nexdoApi } from '../api/nexdoApi';

interface ToastInfo {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AppContextType {
  user: UserAccount;
  currentRole: UserRole | null;
  selectedLanguage: LanguageMetadata;
  toast: ToastInfo | null;
  selectRole: (role: UserRole) => void;
  setLanguage: (code: string) => void;
  updateCustomerProfile: (data: Partial<CustomerProfile>) => void;
  updateTechnicianProfile: (data: Partial<TechnicianProfile>) => void;
  setAuthenticatedUser: (authUser: any, profile?: any) => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  clearToast: () => void;
  logoutToRoleSelect: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount>(INITIAL_USER_ACCOUNT);
  const [currentRole, setCurrentRole] = useState<UserRole | null>('CUSTOMER');
  const [selectedLanguage, setSelectedLanguageState] = useState<LanguageMetadata>(
    SUPPORTED_LANGUAGES.find((l) => l.code === 'ta') || SUPPORTED_LANGUAGES[0]
  );
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const setAuthenticatedUser = (authUser: any, profile?: any) => {
    setUser((prev) => ({
      ...prev,
      id: authUser.id,
      name: profile?.full_name || profile?.name || authUser.name || prev.name,
      phone: authUser.phone || prev.phone,
      email: authUser.email || prev.email,
      customerProfile: {
        ...prev.customerProfile,
        id: profile?.id || prev.customerProfile.id,
        name: profile?.full_name || profile?.name || prev.customerProfile.name,
        phone: authUser.phone || prev.customerProfile.phone,
        address: profile?.address || prev.customerProfile.address,
        city: profile?.city || prev.customerProfile.city,
      },
      technicianProfile: {
        ...prev.technicianProfile,
        id: profile?.id || prev.technicianProfile.id,
        name: profile?.name || prev.technicianProfile.name,
        phone: authUser.phone || prev.technicianProfile.phone,
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
        }
      })
      .catch(() => {
        // No active session or unauthenticated
      });
  }, []);

  const selectRole = (role: UserRole) => {
    setCurrentRole(role);
    showToast(`Switched to ${role === 'CUSTOMER' ? 'Customer' : 'Technician'} mode`, 'info');
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
    setUser((prev) => ({
      ...prev,
      name: data.name || prev.name,
      phone: data.phone || prev.phone,
      dob: data.dob || prev.dob,
      customerProfile: {
        ...prev.customerProfile,
        ...data,
      },
    }));
    showToast('Customer profile updated', 'success');
  };

  const updateTechnicianProfile = (data: Partial<TechnicianProfile>) => {
    setUser((prev) => ({
      ...prev,
      name: data.name || prev.name,
      phone: data.phone || prev.phone,
      dob: data.dob || prev.dob,
      technicianProfile: {
        ...prev.technicianProfile,
        ...data,
      },
    }));
    showToast('Technician profile updated', 'success');
  };

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
    });
  };

  const clearToast = () => setToast(null);

  const logoutToRoleSelect = () => {
    nexdoApi.auth.logout().catch(() => {});
    setCurrentRole(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        currentRole,
        selectedLanguage,
        toast,
        selectRole,
        setLanguage,
        updateCustomerProfile,
        updateTechnicianProfile,
        setAuthenticatedUser,
        showToast,
        clearToast,
        logoutToRoleSelect,
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
