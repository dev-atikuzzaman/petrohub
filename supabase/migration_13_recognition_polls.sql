-- ============================================================
-- Migration 13: টপ কন্ট্রিবিউটর লিডারবোর্ড + ব্যাজ/স্বীকৃতি + পোল/জরিপ
-- ============================================================
-- এই ফাইলটা Supabase Dashboard → SQL Editor এ paste করে "Run" চাপুন।
-- এটা schema.sql এবং আগের সব migration এর *পরে* চালাতে হবে।
-- ============================================================

-- ------------------------------------------------------------
-- 1) BADGES — ব্যাজের ধরন (admin তৈরি করবে, যেমন: "টপ কন্ট্রিবিউটর", "সহায়ক সদস্য")
-- ------------------------------------------------------------
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text not null default '🏅',
  color text not null default '#f59e0b',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

comment on table public.badges is 'ব্যাজ/স্বীকৃতির ধরন — admin কর্তৃক সংজ্ঞায়িত';

-- ------------------------------------------------------------
-- 2) MEMBER_BADGES — কোন সদস্যকে কোন ব্যাজ দেওয়া হয়েছে
-- ------------------------------------------------------------
create table public.member_badges (
  id uuid primary key default gen_random_uuid(),
  badge_id uuid references public.badges(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  awarded_by uuid references public.profiles(id) on delete set null,
  note text,
  awarded_at timestamptz default now(),
  unique (badge_id, user_id)
);

comment on table public.member_badges is 'সদস্যদের দেওয়া ব্যাজ';

-- ------------------------------------------------------------
-- 3) POLLS — পোল/জরিপ প্রশ্ন
-- ------------------------------------------------------------
create table public.polls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  question text not null,
  closes_at timestamptz,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 4) POLL_OPTIONS — প্রতিটা পোলের অপশনসমূহ
-- ------------------------------------------------------------
create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade not null,
  option_text text not null,
  position int not null default 0
);

-- ------------------------------------------------------------
-- 5) POLL_VOTES — এক ইউজার একটা পোলে একটাই ভোট দিতে পারবে
-- ------------------------------------------------------------
create table public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references public.polls(id) on delete cascade not null,
  option_id uuid references public.poll_options(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique (poll_id, user_id)
);

-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------
create index idx_member_badges_user_id on public.member_badges (user_id);
create index idx_member_badges_badge_id on public.member_badges (badge_id);
create index idx_polls_created_at on public.polls (created_at desc);
create index idx_poll_options_poll_id on public.poll_options (poll_id);
create index idx_poll_votes_poll_id on public.poll_votes (poll_id);
create index idx_poll_votes_option_id on public.poll_votes (option_id);

-- ------------------------------------------------------------
-- 6) ROW LEVEL SECURITY
-- ------------------------------------------------------------
alter table public.badges enable row level security;
alter table public.member_badges enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;

-- BADGES policies (সবাই দেখতে পারবে, শুধু admin তৈরি/মুছতে পারবে)
create policy "badges_select_all"
  on public.badges for select
  to authenticated
  using (true);

create policy "badges_insert_admin"
  on public.badges for insert
  to authenticated
  with check (public.is_admin_user());

create policy "badges_update_admin"
  on public.badges for update
  to authenticated
  using (public.is_admin_user());

create policy "badges_delete_admin"
  on public.badges for delete
  to authenticated
  using (public.is_admin_user());

-- MEMBER_BADGES policies (সবাই দেখতে পারবে, শুধু admin দিতে/বাতিল করতে পারবে)
create policy "member_badges_select_all"
  on public.member_badges for select
  to authenticated
  using (true);

create policy "member_badges_insert_admin"
  on public.member_badges for insert
  to authenticated
  with check (public.is_admin_user());

create policy "member_badges_delete_admin"
  on public.member_badges for delete
  to authenticated
  using (public.is_admin_user());

-- POLLS policies (সবাই দেখতে পারবে, নিজের পোল তৈরি/মুছতে পারবে, admin যেকোনোটা মুছতে পারবে)
create policy "polls_select_all"
  on public.polls for select
  to authenticated
  using (true);

create policy "polls_insert_own"
  on public.polls for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "polls_delete_own_or_admin"
  on public.polls for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin_user());

-- POLL_OPTIONS policies (সবাই দেখতে পারবে, পোলের মালিক অপশন তৈরি করতে পারবে)
create policy "poll_options_select_all"
  on public.poll_options for select
  to authenticated
  using (true);

create policy "poll_options_insert_own_poll"
  on public.poll_options for insert
  to authenticated
  with check (exists (
    select 1 from public.polls where id = poll_id and user_id = auth.uid()
  ));

-- POLL_VOTES policies (সবাই দেখতে পারবে, নিজের ভোট দিতে/তুলে নিতে পারবে)
create policy "poll_votes_select_all"
  on public.poll_votes for select
  to authenticated
  using (true);

create policy "poll_votes_insert_own"
  on public.poll_votes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "poll_votes_delete_own"
  on public.poll_votes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 7) REALTIME চালু করা
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.badges;
alter publication supabase_realtime add table public.member_badges;
alter publication supabase_realtime add table public.polls;
alter publication supabase_realtime add table public.poll_options;
alter publication supabase_realtime add table public.poll_votes;

-- ============================================================
-- শেষ — migration 13 সম্পন্ন ✅
-- এরপর app এ: "স্বীকৃতি" ট্যাব থেকে টপ কন্ট্রিবিউটর লিডারবোর্ড ও
-- ব্যাজ দেখা/দেওয়া যাবে, আর ফিড থেকে "নতুন পোল" তৈরি করা যাবে।
-- ============================================================
