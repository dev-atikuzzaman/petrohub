// api/admin-create-user.js
// অ্যাডমিন সরাসরি ইমেইল+পাসওয়ার্ড দিয়ে একজন সদস্যের একাউন্ট বানিয়ে দিতে
// পারবেন — সদস্যকে নিজে signup করতে হবে না, ইমেইল ভেরিফিকেশনেরও দরকার
// নেই (email_confirm: true), এবং সরাসরি approved অবস্থায় তৈরি হয়।
import { getServiceClient, requireAdmin, checkRateLimit } from './_admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const supabaseAdmin = getServiceClient();
  const auth = await requireAdmin(req, supabaseAdmin);
  if (auth.error) {
    res.status(auth.status).json({ error: auth.error });
    return;
  }

  // একই অ্যাডমিন যাতে মিনিটে অতিরিক্ত (২০টির বেশি) ইউজার তৈরি করতে না পারে —
  // ভুলবশত স্ক্রিপ্ট লুপ বা compromised token থেকে সুরক্ষা
  const rl = checkRateLimit(`create-user:${auth.user.id}`, { maxRequests: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    res.status(429).json({ error: 'অনেক বেশি অনুরোধ হয়েছে, একটু পর আবার চেষ্টা করুন' });
    return;
  }

  const {
    name, email, password, district, university, subject,
    company, designation, department,
  } = req.body || {};

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: 'নাম, ইমেইল ও পাসওয়ার্ড আবশ্যক' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' });
    return;
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { name: name.trim() },
  });

  if (createError) {
    res.status(400).json({ error: translateSupabaseError(createError.message) });
    return;
  }

  const newUserId = created.user.id;

  // handle_new_user trigger থেকে ইতিমধ্যে একটা বেসিক profiles row তৈরি
  // হয়ে গেছে — এখন বাকি তথ্য বসিয়ে ও সরাসরি approved করে দেওয়া হচ্ছে
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      name: name.trim(), district, university, subject,
      company, current_company: company, designation, department,
      approved: true,
    })
    .eq('id', newUserId);

  if (updateError) {
    res.status(200).json({ ok: true, warning: `একাউন্ট তৈরি হয়েছে, কিন্তু প্রোফাইল তথ্য বসাতে সমস্যা হয়েছে: ${updateError.message}` });
    return;
  }

  res.status(200).json({ ok: true });
}

function translateSupabaseError(msg) {
  if (/already been registered|already exists/i.test(msg)) return 'এই ইমেইল দিয়ে আগেই একাউন্ট আছে';
  if (/password/i.test(msg)) return 'পাসওয়ার্ড খুবই দুর্বল, অন্তত ৬ অক্ষর দিন';
  return msg;
}
