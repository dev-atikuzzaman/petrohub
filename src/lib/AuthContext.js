// src/lib/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // প্রোফাইল লোড/রিফ্রেশ করার হেল্পার
  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Profile load error:', error.message);
      return null;
    }
    setProfile(data);
    return data;
  }

  useEffect(() => {
    let isInitial = true;

    // onAuthStateChange নিজেই app লোড হওয়ার সাথে সাথে একবার INITIAL_SESSION
    // event দিয়ে fire হয় — তাই getSession() আলাদাভাবে কল করে duplicate/racing
    // fetch তৈরি করার দরকার নেই। এটাই single source of truth।
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => {
          if (isInitial) {
            setLoading(false);
            isInitial = false;
          }
        });
      } else {
        setProfile(null);
        if (isInitial) {
          setLoading(false);
          isInitial = false;
        }
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    return { data, error };
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }

  async function refreshProfile() {
    if (session?.user) {
      return loadProfile(session.user.id);
    }
    return null;
  }

  async function updatePassword(currentPassword, newPassword) {
    // নিরাপত্তার জন্য আগে current password verify করা হয় re-login করে,
    // যাতে কেউ অন্যের খোলা সেশন থেকে পাসওয়ার্ড বদলাতে না পারে
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword,
    });
    if (verifyError) {
      return { error: { message: 'বর্তমান পাসওয়ার্ড সঠিক নয়' } };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  }

  const value = {
    session,
    user: session?.user || null,
    profile,
    loading,
    isAdmin: !!profile?.is_admin,
    isApproved: !!profile?.approved,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
