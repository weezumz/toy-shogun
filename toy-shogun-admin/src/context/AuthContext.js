import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const authUser = data?.session?.user ?? null;
        setUser(authUser);
        if (authUser) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', authUser.id)
            .single();
          console.log('Role data:', userData, 'Error:', error);
          setRole(userData?.role || 'staff');
        }
      } catch (err) {
        console.error('Session error:', err);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []); // ← no listener at all

  const logout = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    // role was missing from here!
    <AuthContext.Provider value={{ user, role, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}