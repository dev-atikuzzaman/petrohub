import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

// supabaseClient.js আসল নেটওয়ার্ক কল করে (@supabase/supabase-js দিয়ে),
// টেস্টে সেটা আমরা চাই না। তাই পুরো মডিউলটা mock করে দেওয়া হলো —
// প্রতিটা auth মেথড একটা jest.fn(), যাতে টেস্টে ইচ্ছেমতো control করা যায়।
jest.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      updateUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
    },
    from: jest.fn(),
  },
}));

import { supabase } from './supabaseClient';

// একটা ছোট টেস্ট কম্পোনেন্ট যেটা useAuth() হুক থেকে state ও ফাংশন বের করে
// স্ক্রিনে দেখায় ও বাটনের মাধ্যমে কল করার সুযোগ দেয়।
function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{String(auth.loading)}</div>
      <div data-testid="user-email">{auth.user?.email || 'কেউ নেই'}</div>
      <button onClick={() => auth.signIn('test@example.com', 'password123')}>সাইন ইন</button>
      <button onClick={() => auth.signOut()}>সাইন আউট</button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ডিফল্টভাবে onAuthStateChange কে এমনভাবে mock করা হচ্ছে যেন এটা
    // সাথে সাথে "কোনো session নেই" জানিয়ে দেয় (unauthenticated অবস্থা),
    // ঠিক যেমন আসল Supabase প্রথমবার INITIAL_SESSION event পাঠায়।
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      callback('INITIAL_SESSION', null);
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });
  });

  test('প্রাথমিক অবস্থায় লোডিং শেষ হয় এবং কোনো ইউজার থাকে না', async () => {
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('user-email').textContent).toBe('কেউ নেই');
  });

  test('সঠিক ইমেইল-পাসওয়ার্ড দিয়ে signIn কল করলে supabase.auth.signInWithPassword ঠিক আর্গুমেন্টসহ কল হয়', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      await userEvent.click(screen.getByText('সাইন ইন'));
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  test('signIn ব্যর্থ হলে error অবজেক্ট ফেরত দেয়, throw করে না', async () => {
    const mockError = { message: 'Invalid login credentials' };
    supabase.auth.signInWithPassword.mockResolvedValue({ data: null, error: mockError });

    let authRef;
    function Capture() {
      authRef = useAuth();
      return null;
    }
    render(
      <AuthProvider>
        <Capture />
      </AuthProvider>
    );
    await waitFor(() => expect(authRef.loading).toBe(false));

    const result = await act(async () => authRef.signIn('wrong@example.com', 'badpass'));
    expect(result.error).toEqual(mockError);
  });

  test('signOut কল করলে supabase.auth.signOut ডাকা হয় এবং profile/session রিসেট হয়', async () => {
    supabase.auth.signOut.mockResolvedValue({ error: null });
    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      await userEvent.click(screen.getByText('সাইন আউট'));
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(screen.getByTestId('user-email').textContent).toBe('কেউ নেই');
  });

  test('session থাকলে প্রোফাইল লোড হয়ে ইউজার ইমেইল দেখায়', async () => {
    const fakeSession = { user: { id: 'user-1', email: 'akib@example.com' } };
    const singleMock = jest.fn().mockResolvedValue({
      data: { id: 'user-1', name: 'Akib', is_admin: false, approved: true },
      error: null,
    });
    supabase.from.mockReturnValue({
      select: () => ({ eq: () => ({ single: singleMock }) }),
    });
    supabase.auth.onAuthStateChange.mockImplementation((callback) => {
      callback('INITIAL_SESSION', fakeSession);
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    renderWithAuth();

    await waitFor(() => expect(screen.getByTestId('user-email').textContent).toBe('akib@example.com'));
    expect(singleMock).toHaveBeenCalled();
  });
});
