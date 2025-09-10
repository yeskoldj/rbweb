'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { getUser, clearUser, StoredUser } from './authStorage';

interface AuthContextType {
  user: StoredUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      clearUser();
      setUser(null);
    } else {
      const stored = getUser();
      if (stored) {
        setUser(stored);
      } else {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

