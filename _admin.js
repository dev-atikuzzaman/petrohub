// api/_admin.js
// ============================================================
// শেয়ার্ড হেল্পার — service-role Supabase client + "রিকোয়েস্ট
// পাঠানো ব্যক্তি সত্যিই admin কিনা" যাচাই। এই ফাইলটা নিজে কোনো route
// না (নাম আন্ডারস্কোর দিয়ে শুরু বলে Vercel এটাকে API endpoint হিসেবে
// গণ্য করে না), শুধু বাকি admin-* ফাংশনগুলো এটা import করে ব্যবহার করে।
//
// নিরাপত্তা নোট: SUPABASE_SERVICE_ROLE_KEY একটা অত্যন্ত স্পর্শকাতর
// কী — এটা RLS (Row Level Security) সম্পূর্ণ বাইপাস করে দেয়। এটা
// কখনোই ফ্রন্টএন্ড কোডে বা REACT_APP_ প্রিফিক্স দিয়ে রাখা যাবে না,
// শুধু Vercel এর Environment Variables এ (server-side only) রাখতে হবে।
// ============================================================
import { createClient } from '@supabase/supabase-js';

export function getServiceClient() {
  return createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Authorization: Bearer <access_token> হেডার থেকে ব্যবহারকারী শনাক্ত করে,
 * তারপর profiles টেবিলে is_admin true কিনা যাচাই করে।
 * রিটার্ন করে { user } (সফল হলে) অথবা { error, status } (ব্যর্থ হলে)।
 */
export async function requireAdmin(req, supabaseAdmin) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return { error: 'লগইন করা নেই', status: 401 };

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) return { error: 'সেশন অবৈধ, আবার লগইন করুন', status: 401 };

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profile?.is_admin) return { error: 'শুধু অ্যাডমিনরা এই কাজটি করতে পারবেন', status: 403 };

  return { user: userData.user };
}
