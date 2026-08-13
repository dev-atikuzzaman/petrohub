-- ============================================================
-- Migration 15: এনগেজমেন্ট অ্যানালিটিক্স (post views) + রিপোর্ট/মডারেশন
-- ============================================================
-- এই ফাইলটা Supabase Dashboard → SQL Editor এ paste করে "Run" চাপুন।
-- schema.sql ও আগের সব migration এর *পরে* চালাতে হবে।
-- ============================================================

-- ------------------------------------------------------------
-- 1) POST_VIEWS — কোন পোস্ট কে দেখেছে (unique viewer count এর জন্য)
-- ------------------------------------------------------------
create table public.post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  viewed_at timestamptz default now(),
  unique (post_id, user_id)
);

comment on table public.post_views is 'কোন সদস্য কোন পোস্ট দেখেছেন — এনগেজমেন্ট অ্যানালিটিক্সের জন্য';

create index idx_post_views_post_id on public.post_views (post_id);
create index idx_post_views_user_id on public.post_views (user_id);

-- ------------------------------------------------------------
-- 2) POST_REPORTS — অনুপযুক্ত পোস্ট রিপোর্ট করার সিস্টেম
-- ------------------------------------------------------------
create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  reported_by uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

comment on table public.post_reports is 'সদস্যদের রিপোর্ট করা অনুপযুক্ত পোস্ট, admin মডারেট করবে';

create index idx_post_reports_post_id on public.post_reports (post_id);
create index idx_post_reports_status on public.post_reports (status);

-- ------------------------------------------------------------
-- 3) ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.post_views enable row level security;
alter table public.post_reports enable row level security;

-- POST_VIEWS policies (নিজের ভিউ নিজে insert করবে, শুধু admin দেখতে পারবে aggregate analytics এর জন্য)
create policy "post_views_select_admin"
  on public.post_views for select
  to authenticated
  using (public.is_admin_user());

create policy "post_views_insert_own"
  on public.post_views for insert
  to authenticated
  with check (auth.uid() = user_id);

-- POST_REPORTS policies (সবাই রিপোর্ট করতে পারবে, শুধু admin দেখতে/আপডেট/মুছতে পারবে)
create policy "post_reports_select_admin"
  on public.post_reports for select
  to authenticated
  using (public.is_admin_user());

create policy "post_reports_insert_own"
  on public.post_reports for insert
  to authenticated
  with check (auth.uid() = reported_by);

create policy "post_reports_update_admin"
  on public.post_reports for update
  to authenticated
  using (public.is_admin_user());

create policy "post_reports_delete_admin"
  on public.post_reports for delete
  to authenticated
  using (public.is_admin_user());

-- ------------------------------------------------------------
-- 4) REALTIME চালু করা
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.post_reports;

-- ============================================================
-- শেষ — migration 15 সম্পন্ন ✅
-- এরপর app এ: Admin Panel → "অ্যানালিটিক্স" ট্যাবে এনগেজমেন্ট/সক্রিয়তা
-- দেখা যাবে, আর "রিপোর্ট" ট্যাবে সদস্যদের রিপোর্ট করা পোস্ট মডারেট
-- করা যাবে। প্রতিটা পোস্টের "..." মেনু থেকে "রিপোর্ট করুন" অপশন যোগ হয়েছে।
-- ============================================================
