// AuthContext.js
// This file manages authentication state globally across the entire app.
// "Context" in React means shared data that any component can access without
// passing props manually through every level of the component tree.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Create the context object — this is the "container" for our auth data
const AuthContext = createContext();

// AuthProvider wraps the entire app (see App.js) so all pages can access auth state
export function AuthProvider({ children }) {
  // user: stores the currently logged-in user object, or null if not logged in
  const [user, setUser] = useState(null);

  // loading: prevents the app from rendering until we know the auth state
  // avoids a flash of the login page when the user is already logged in
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On app load, check if there's an existing session (e.g. user already logged in)
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        // If a session exists, set the user — otherwise set null
        setUser(data?.session?.user ?? null);
      } catch (err) {
        console.error('Session error:', err);
        setUser(null);
      } finally {
        // Whether it succeeds or fails, we're done loading
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth state changes in real time
    // e.g. user logs in, logs out, or token refreshes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup: unsubscribe from the listener when the component unmounts
    return () => listener?.subscription?.unsubscribe();
  }, []);

  // logout: signs the user out of Supabase and clears the session
  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    // Provide user, logout, and loading to any component that calls useAuth()
    <AuthContext.Provider value={{ user, logout, loading }}>
      {/* Don't render children until we know the auth state */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook — lets any component access auth data with just: const { user } = useAuth()
export function useAuth() {
  return useContext(AuthContext);
}