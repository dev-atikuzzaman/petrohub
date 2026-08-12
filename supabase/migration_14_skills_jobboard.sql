-- ============================================================
-- Migration 14: স্কিল/এক্সপার্টিজ ট্যাগ + ইন্টার্নাল জব/সুযোগ বোর্ড
-- ============================================================
-- এই ফাইলটা Supabase Dashboard → SQL Editor এ paste করে "Run" চাপুন।
-- schema.sql ও আগের সব migration এর *পরে* চালাতে হবে।
-- ============================================================

-- ------------------------------------------------------------
-- 1) SKILLS — প্রোফাইলে দক্ষতা/এক্সপার্টিজ ট্যাগ (array of text)
-- ------------------------------------------------------------
alter table public.profiles add column if not exists skills text[] default '{}';

create index if not exists idx_profiles_skills on public.profiles using gin (skills);

-- ------------------------------------------------------------
-- 2) JOB_POSTINGS — ইন্টার্নাল জব/সুযোগ বোর্ড
-- ------------------------------------------------------------
create table public.job_postings (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  company text,
  location text,
  job_type text default 'full_time' check (job_type in ('full_time', 'part_time', 'internship', 'contract', 'referral', 'transfer')),
  description text,
  contact_info text,
  deadline timestamptz,
  created_at timestamptz default now()
);

comment on table public.job_postings is 'সদস্যদের পোস্ট করা ইন্টার্নাল জব/রেফারেল/ট্রান্সফার সুযোগ';

create index idx_job_postings_created_at on public.job_postings (created_at desc);
create index idx_job_postings_posted_by on public.job_postings (posted_by);

-- ------------------------------------------------------------
-- 3) ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.job_postings enable row level security;

create policy "job_postings_select_all"
  on public.job_postings for select
  to authenticated
  using (true);

create policy "job_postings_insert_own"
  on public.job_postings for insert
  to authenticated
  with check (auth.uid() = posted_by);

create policy "job_postings_update_own_or_admin"
  on public.job_postings for update
  to authenticated
  using (auth.uid() = posted_by or public.is_admin_user());

create policy "job_postings_delete_own_or_admin"
  on public.job_postings for delete
  to authenticated
  using (auth.uid() = posted_by or public.is_admin_user());

-- ------------------------------------------------------------
-- 4) REALTIME চালু করা
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.job_postings;

-- ============================================================
-- শেষ — migration 14 সম্পন্ন ✅
-- এরপর app এ: প্রোফাইল এডিট করে স্কিল ট্যাগ যোগ করা যাবে, সদস্য তালিকায়
-- স্কিল দিয়ে খোঁজা যাবে, আর "সুযোগ" ট্যাব থেকে ইন্টার্নাল জব/রেফারেল
-- পোস্ট ও দেখা যাবে।
-- ============================================================
