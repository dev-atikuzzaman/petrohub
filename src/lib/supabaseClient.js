// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// এই দুটো env variable বিল্ড-টাইমে না থাকলে createClient() সরাসরি throw করে,
// এবং সেটা App.js/React রেন্ডার হওয়ারও আগে ঘটে — মানে ErrorBoundary সেটা
// ধরতেই পারে না, ফলে পুরো পেজ সাদা থেকে যায় কোনো error message ছাড়াই।
// তাই এখানে try/catch দিয়ে সেই crash আটকে, একটা দৃশ্যমান error message
// সরাসরি DOM-এ বসিয়ে দেওয়া হচ্ছে যাতে ব্যবহারকারী অন্তত বুঝতে পারে কী ভুল।
let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  const msg = '⚠️ Supabase কনফিগারেশন পাওয়া যায়নি (REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY)। Vercel প্রজেক্টের Settings → Environment Variables-এ এই দুটো ভ্যারিয়েবল সেট করে আবার Deploy করো।';
  console.error(msg);
  showFatalConfigError(msg);
  // ডামি ক্লায়েন্ট — যাতে বাকি কোড import করার সময় crash না করে,
  // যেসব কল হবে সেগুলো শুধু resolve হয়ে খালি error ফেরত দেবে।
  supabase = {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase কনফিগার করা নেই' } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'Supabase কনফিগার করা নেই' } }) }) }),
    }),
  };
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (err) {
    console.error('❌ Supabase client তৈরি করতে ব্যর্থ:', err);
    showFatalConfigError('⚠️ Supabase client তৈরি করতে সমস্যা হয়েছে: ' + (err && err.message ? err.message : String(err)));
    throw err;
  }
}

function showFatalConfigError(message) {
  if (typeof document === 'undefined') return;
  const render = () => {
    const root = document.getElementById('root');
    const target = root || document.body;
    target.innerHTML =
      '<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'padding:24px;text-align:center;background:#f8fafc;font-family:sans-serif;">' +
      '<div style="font-size:44px;margin-bottom:12px;">⚠️</div>' +
      '<h2 style="margin:0 0 8px;color:#0f172a;">অ্যাপ কনফিগারেশনে সমস্যা</h2>' +
      '<p style="color:#64748b;font-size:14px;max-width:360px;line-height:1.6;">' + message + '</p>' +
      '</div>';
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
}

export { supabase };
export default supabase;
