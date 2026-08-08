import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type StaffLoginResult = 'success' | 'invalid-credentials' | 'api-unavailable';

type AppState = {
  isStaff: boolean;
  loginStaff: (username: string, password: string) => Promise<StaffLoginResult>;
  logoutStaff: () => Promise<void>;
};

const AppContext = createContext<AppState | undefined>(undefined);

type AppProviderProps = {
  children: ReactNode;
};

const STAFF_STORAGE_KEY = 'communityStaffLoggedIn';

export function AppProvider({ children }: AppProviderProps) {
  const [isStaff, setIsStaff] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STAFF_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const syncSession = async () => {
      try {
        const response = await fetch('/api/staff/session');
        const data = await response.json();
        if (data?.isStaff) {
          setIsStaff(true);
          window.localStorage.setItem(STAFF_STORAGE_KEY, 'true');
        } else {
          setIsStaff(false);
          window.localStorage.removeItem(STAFF_STORAGE_KEY);
        }
      } catch {
        // If the auth server is unavailable, keep the last known local state.
      }
    };

    syncSession();
  }, []);

  const loginStaff = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return 'invalid-credentials';
        }
        return 'api-unavailable';
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return 'api-unavailable';
      }

      const data = await response.json();
      if (data?.success === false) {
        return 'invalid-credentials';
      }

      setIsStaff(true);
      window.localStorage.setItem(STAFF_STORAGE_KEY, 'true');
      return 'success';
    } catch {
      return 'api-unavailable';
    }
  };

  const logoutStaff = async () => {
    try {
      await fetch('/api/staff/logout', { method: 'POST' });
    } catch {
      // Clear local state even if server logout fails.
    }
    setIsStaff(false);
    window.localStorage.removeItem(STAFF_STORAGE_KEY);
  };

  return (
    <AppContext.Provider value={{ isStaff, loginStaff, logoutStaff }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}
