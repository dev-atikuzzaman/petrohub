// api/admin-delete-user.js
// অ্যাডমিন সরাসরি কোনো সদস্যের একাউন্ট মুছে দিতে পারবেন — auth.users থেকে
// ডিলিট হলে profiles টেবিলের row-ও cascade হয়ে স্বয়ংক্রিয়ভাবে মুছে যায়
// (schema.sql তে "on delete cascade" দেওয়া আছে)।
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

  const { userId } = req.body || {};
  if (!userId) {
    res.status(400).json({ error: 'userId আবশ্যক' });
    return;
  }

  if (userId === auth.user.id) {
    res.status(400).json({ error: 'নিজের একাউন্ট নিজে ডিলিট করা যাবে না' });
    return;
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(200).json({ ok: true });
}
