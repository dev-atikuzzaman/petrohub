-- ============================================================
-- Petro Knowledge Hub — Supabase Schema
-- আকিব | BGFCL | Petro Special Foundation Training
-- ============================================================
-- এই পুরো ফাইলটা Supabase Dashboard → SQL Editor এ paste করে
-- "Run" চাপলেই সব table, security rule, trigger তৈরি হয়ে যাবে।
-- ============================================================

-- ------------------------------------------------------------
-- 1) PROFILES টেবিল (প্রতিটা ইউজারের তথ্য)
-- ------------------------------------------------------------
-- auth.users (Supabase Auth) এর সাথে 1:1 linked।
-- signup হওয়ার সাথে সাথে trigger দিয়ে একটা খালি profile তৈরি হয়ে যাবে।

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'নতুন সদস্য',
  email text,
  phone text,
  district text,
  university text,
  subject text,
  company text,
  original_company text,
  designation text,
  department text,
  address text,
  status text default 'Active' check (status in ('Active', 'Resigned')),
  current_company text,
  batch text default 'Petro Special Foundation Training 2026',
  avatar_url text,
  is_admin boolean default false,
  is_preloaded boolean default false,   -- admin এর pre-loaded placeholder কিনা
  claimed boolean default true,          -- signup করে claim করা হয়েছে কিনা
  joined_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.profiles is 'প্রতিটা Petro ট্রেইনির প্রোফাইল তথ্য';

-- ------------------------------------------------------------
-- 1.5) PENDING_INVITES টেবিল
-- ------------------------------------------------------------
-- Admin signup এর আগেই ৮০ জনের নাম/ইমেইল এখানে বসিয়ে রাখতে পারবে।
-- যখন সেই email দিয়ে কেউ signup করবে, app সেটা match করে
-- প্রোফাইলে pre-filled তথ্য বসিয়ে দেবে এবং এই row delete করবে।

create table public.pending_invites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  district text,
  university text,
  subject text,
  company text,
  designation text,
  department text,
  created_at timestamptz default now()
);

comment on table public.pending_invites is 'Admin কর্তৃক pre-loaded সদস্য তালিকা, signup এর অপেক্ষায়';

-- ------------------------------------------------------------
-- 2) POSTS টেবিল
-- ------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  text text not null,
  image_url text,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 3) COMMENTS টেবিল (reply সহ, parent_id দিয়ে nested)
-- ------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  text text not null,
  created_at timestamptz default now()
);

-- ------------------------------------------------------------
-- 4) REACTIONS টেবিল (emoji reactions, এক ইউজার এক পোস্টে একটা reaction)
-- ------------------------------------------------------------
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique (post_id, user_id)
);

-- ------------------------------------------------------------
-- INDEXES (performance)
-- ------------------------------------------------------------
create index idx_posts_created_at on public.posts (created_at desc);
create index idx_comments_post_id on public.comments (post_id);
create index idx_reactions_post_id on public.reactions (post_id);
create index idx_profiles_district on public.profiles (district);
create index idx_profiles_university on public.profiles (university);
create index idx_profiles_company on public.profiles (current_company);

-- ------------------------------------------------------------
-- 5) AUTO-UPDATE updated_at
-- ------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------
-- 6) NEW USER SIGNUP হলে স্বয়ংক্রিয়ভাবে profile তৈরি
-- ------------------------------------------------------------
-- যদি admin আগে থেকে email দিয়ে placeholder profile বানিয়ে রাখে,
-- আর সেই email দিয়েই কেউ signup করে, তাহলে placeholder টা claim হবে
-- (নতুন profile তৈরি না করে পুরোনোটার id আপডেট করার বদলে আমরা
--  সহজ approach নিচ্ছি: signup করলেই নতুন profile row তৈরি হবে,
--  placeholder থাকলে app থেকে আলাদাভাবে merge/delete করা যাবে)

create or replace function public.handle_new_user()
returns trigger as $$
declare
  invite record;
begin
  -- pending_invites এ এই email আগে থেকে pre-load করা আছে কিনা চেক
  select * into invite from public.pending_invites where email = new.email limit 1;

  if invite.id is not null then
    -- pre-loaded তথ্য দিয়ে profile তৈরি
    insert into public.profiles (
      id, name, email, district, university, subject,
      company, current_company, designation, department, claimed
    )
    values (
      new.id,
      invite.name,
      new.email,
      invite.district,
      invite.university,
      invite.subject,
      invite.company,
      invite.company,
      invite.designation,
      invite.department,
      true
    )
    on conflict (id) do nothing;

    -- ব্যবহৃত invite মুছে ফেলা
    delete from public.pending_invites where id = invite.id;
  else
    -- কোনো pre-load না থাকলে খালি profile
    insert into public.profiles (id, name, email, claimed)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.email,
      true
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 6.5) ADMIN চেক করার HELPER FUNCTION (RLS recursion এড়াতে)
-- ------------------------------------------------------------
create or replace function public.is_admin_user()
returns boolean as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$ language sql security definer stable set search_path = public;

-- ------------------------------------------------------------
-- 7) ROW LEVEL SECURITY (RLS) চালু করা
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.pending_invites enable row level security;

-- PENDING_INVITES policies (শুধু admin দেখতে/যোগ করতে/মুছতে পারবে)
create policy "invites_select_admin"
  on public.pending_invites for select
  to authenticated
  using (public.is_admin_user());

create policy "invites_insert_admin"
  on public.pending_invites for insert
  to authenticated
  with check (public.is_admin_user());

create policy "invites_delete_admin"
  on public.pending_invites for delete
  to authenticated
  using (public.is_admin_user());

-- signup trigger কে pending_invites পড়তে দিতে hবে (security definer থাকায় এমনিতেই কাজ করবে,
-- কিন্তু trigger function নিজে RLS bypass করে কারণ security definer)


-- PROFILES policies
-- সবাই সবার profile দেখতে পারবে (member directory এর জন্য দরকার)
create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

-- নিজের profile নিজে update করতে পারবে
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- admin সবার profile update করতে পারবে (admin panel এর জন্য)
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin_user());

-- admin নতুন placeholder profile insert করতে পারবে
create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin_user());

-- POSTS policies
create policy "posts_select_all"
  on public.posts for select
  to authenticated
  using (true);

create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "posts_update_own"
  on public.posts for update
  to authenticated
  using (auth.uid() = user_id);

create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- COMMENTS policies
create policy "comments_select_all"
  on public.comments for select
  to authenticated
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "comments_delete_own"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- REACTIONS policies
create policy "reactions_select_all"
  on public.reactions for select
  to authenticated
  using (true);

create policy "reactions_insert_own"
  on public.reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "reactions_update_own"
  on public.reactions for update
  to authenticated
  using (auth.uid() = user_id);

create policy "reactions_delete_own"
  on public.reactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 8) REALTIME চালু করা (live updates এর জন্য)
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.reactions;
alter publication supabase_realtime add table public.profiles;

-- ------------------------------------------------------------
-- 9) STORAGE BUCKETS (avatar ও post image upload এর জন্য)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Storage policies: logged-in যে কেউ নিজের ফোল্ডারে আপলোড করতে পারবে,
-- সবাই public read করতে পারবে।
create policy "avatar_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatar_upload_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatar_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "post_image_public_read"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "post_image_upload_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------
-- 10) NOTES / IMPORTANT_UPDATES / DOCUMENTS + কাস্টম প্রোফাইল ফিল্ড
-- ------------------------------------------------------------
-- বিস্তারিত সহ সম্পূর্ণ সংজ্ঞা supabase/migration_2_notes_updates_documents.sql
-- এ আছে (নতুন ইনস্টলেও কাজ করবে, আগে থেকে থাকা প্রজেক্টেও নিরাপদে চলবে)।
-- এই ফাইলে (schema.sql) নতুন প্রজেক্ট সেটআপের সুবিধার জন্য শুধু referrence
-- রাখা হলো — আসল কোড migration ফাইলে। প্রথমবার সেটআপ করলে schema.sql এর
-- পর migration_2_notes_updates_documents.sql ফাইলটাও চালাতে ভুলবেন না।

-- ------------------------------------------------------------
-- 11) প্রথম ADMIN বানানো (নিজে নিজে করতে হবে)
-- ------------------------------------------------------------
-- এই স্ক্রিপ্ট চালানোর পর, আপনি App এ একবার signup করুন।
-- তারপর Supabase Dashboard → SQL Editor এ এই কমান্ড চালান
-- (নিজের ইমেইল বসিয়ে):
--
-- update public.profiles set is_admin = true where email = 'আপনার_ইমেইল@gmail.com';
--
-- ============================================================
-- শেষ — schema তৈরি সম্পন্ন ✅
-- ============================================================
