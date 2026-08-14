// api/admin-invite-user.js
// অ্যাডমিন কাউকে ইমেইলে সরাসরি "ইনভাইট" পাঠাতে পারবেন — Supabase একটা
// ইমেইল পাঠায় যেখানে লিংকে ক্লিক করে সেই ব্যক্তি নিজেই পাসওয়ার্ড সেট
// করে একাউন্ট activate করবেন (admin-create-user এর বিপরীত — এখানে
// পাসওয়ার্ড admin না, ব্যবহারকারী নিজে ঠিক করেন)।
import { getServiceClient, requireAdmin } from './_admin';

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

  const {
    name, email, district, university, subject,
    company, designation, department, redirectTo,
  } = req.body || {};

  if (!name?.trim() || !email?.trim()) {
    res.status(400).json({ error: 'নাম ও ইমেইল আবশ্যক' });
    return;
  }

  const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email.trim(),
    { data: { name: name.trim() }, redirectTo: redirectTo || undefined }
  );

  if (inviteError) {
    res.status(400).json({ error: translateSupabaseError(inviteError.message) });
    return;
  }

  const newUserId = invited.user.id;

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      name: name.trim(), district, university, subject,
      company, current_company: company, designation, department,
      approved: true,
    })
    .eq('id', newUserId);

  if (updateError) {
    res.status(200).json({ ok: true, warning: `ইনভাইট পাঠানো হয়েছে, কিন্তু প্রোফাইল তথ্য বসাতে সমস্যা হয়েছে: ${updateError.message}` });
    return;
  }

  res.status(200).json({ ok: true });
}

function translateSupabaseError(msg) {
  if (/already been registered|already exists/i.test(msg)) return 'এই ইমেইল দিয়ে আগেই একাউন্ট আছে';
  return msg;
}
