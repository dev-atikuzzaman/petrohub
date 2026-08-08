-- ============================================================
-- Petro Knowledge Hub — Migration 12
-- মন্তব্য এডিট করার সুবিধা
-- ============================================================
-- Supabase Dashboard → SQL Editor → New Query তে পুরোটা পেস্ট করে Run করুন।
-- নিরাপদ (idempotent) — বারবার চালালেও সমস্যা নেই।
-- ============================================================

-- মন্তব্য এডিট করলে "সম্পাদিত" লেখা দেখানোর জন্য
alter table public.comments
  add column if not exists edited_at timestamptz;

-- শুধু নিজের মন্তব্য নিজে এডিট করতে পারবেন
drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- শেষ ✅ — এখন মন্তব্য এডিট করা যাবে
-- ============================================================
