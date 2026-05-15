import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      if (session?.user) {
        setUser(session.user);
        supabase.from('users').select('role').eq('id', session.user.id).maybeSingle()
          .then(({ data }) => setRole(data?.role ?? null));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null;
      setUser(authUser);
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .maybeSingle();
        setRole(userData?.role ?? null);
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    setUser(null);
    setRole(null);
    await supabase.auth.signOut();
  };

  return (
    // role was missing from here!
    <AuthContext.Provider value={{ user, role, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}