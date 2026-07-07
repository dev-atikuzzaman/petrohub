-- ============================================================
-- Petro Knowledge Hub — Migration 2
-- নোট, গুরুত্বপূর্ণ আপডেট, ডকুমেন্ট টেবিল + কাস্টম প্রোফাইল ফিল্ড
-- ============================================================
-- কেন লাগবে: "নোট", "আপডেট" ও "ডকুমেন্ট" ট্যাব থেকে কিছু সেভ/আপলোড
-- হচ্ছিল না — কারণ notes, important_updates, documents টেবিল এবং
-- documents স্টোরেজ বাকেট আসলে কখনোই তৈরি হয়নি (schema.sql এ ছিল না)।
--
-- এই স্ক্রিপ্টটা সম্পূর্ণ নিরাপদ (idempotent) — আগে একবার চালানো হয়ে
-- থাকলেও আবার চালালে সমস্যা হবে না, কারণ সবকিছু "if not exists" দিয়ে
-- করা। Supabase Dashboard → SQL Editor → New Query তে পুরো ফাইল paste
-- করে Run চাপুন।
-- ============================================================

-- ------------------------------------------------------------
-- 1) NOTES টেবিল (ব্যক্তিগত — শুধু নিজে দেখবে)
-- ------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  body text not null,
  color text default 'green',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_notes_user_id on public.notes (user_id);

drop trigger if exists notes_updated_at on public.notes;
create trigger notes_updated_at
  before update on public.notes
  for each row execute function public.handle_updated_at();

alter table public.notes enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
  on public.notes for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
  on public.notes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
  on public.notes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
  on public.notes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2) IMPORTANT_UPDATES টেবিল (সবাই দেখবে, যে কেউ পোস্ট করতে পারবে)
-- ------------------------------------------------------------
create table if not exists public.important_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  priority text default 'normal' check (priority in ('urgent', 'high', 'normal')),
  start_date date,
  deadline date,
  created_at timestamptz default now()
);

create index if not exists idx_important_updates_created_at on public.important_updates (created_at desc);

alter table public.important_updates enable row level security;

drop policy if exists "important_updates_select_all" on public.important_updates;
create policy "important_updates_select_all"
  on public.important_updates for select
  to authenticated
  using (true);

drop policy if exists "important_updates_insert_own" on public.important_updates;
create policy "important_updates_insert_own"
  on public.important_updates for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "important_updates_update_own" on public.important_updates;
create policy "important_updates_update_own"
  on public.important_updates for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "important_updates_delete_own" on public.important_updates;
create policy "important_updates_delete_own"
  on public.important_updates for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin_user());

-- ------------------------------------------------------------
-- 3) DOCUMENTS টেবিল (সবাই দেখবে/ডাউনলোড করবে, যে কেউ আপলোড করতে পারবে)
-- ------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  file_url text not null,
  file_name text,
  file_size bigint,
  file_type text,
  category text default 'সাধারণ',
  created_at timestamptz default now()
);

create index if not exists idx_documents_created_at on public.documents (created_at desc);

alter table public.documents enable row level security;

drop policy if exists "documents_select_all" on public.documents;
create policy "documents_select_all"
  on public.documents for select
  to authenticated
  using (true);

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own"
  on public.documents for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own"
  on public.documents for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own"
  on public.documents for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin_user());

-- ------------------------------------------------------------
-- 4) DOCUMENTS স্টোরেজ বাকেট (ফাইল আপলোডের জন্য — এটাই মূল কারণ
--    ছিল যে ডকুমেন্ট আপলোড কাজ করছিল না, কারণ বাকেটই ছিল না)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

drop policy if exists "documents_public_read" on storage.objects;
create policy "documents_public_read"
  on storage.objects for select
  using (bucket_id = 'documents');

drop policy if exists "documents_upload_own" on storage.objects;
create policy "documents_upload_own"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents_delete_own" on storage.objects;
create policy "documents_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------
-- 5) REALTIME চালু করা (নতুন টেবিলগুলোর জন্য লাইভ আপডেট)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'important_updates'
  ) then
    alter publication supabase_realtime add table public.important_updates;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'documents'
  ) then
    alter publication supabase_realtime add table public.documents;
  end if;
end $$;

-- ------------------------------------------------------------
-- 6) প্রোফাইলে কাস্টম ফিল্ড (Settings → অ্যাকাউন্ট তথ্য → "নতুন ফিল্ড")
-- ------------------------------------------------------------
-- যেকোনো সংখ্যক ব্যবহারকারী-সংজ্ঞায়িত ফিল্ড রাখার জন্য একটা jsonb
-- কলাম — প্রতিটা এন্ট্রি { label: "...", value: "..." } আকারে থাকবে।
alter table public.profiles
  add column if not exists custom_fields jsonb not null default '{}'::jsonb;

-- আগে থেকে যাদের প্রোফাইলে পুরোনো "BIM ... 2025" ব্যাচের নাম বসানো আছে,
-- তাদের জন্য স্বয়ংক্রিয়ভাবে নতুন ব্যাচের নাম বসিয়ে দেওয়া হচ্ছে —
-- কেউ ইতিমধ্যে নিজের মতো করে ব্যাচ এডিট করে থাকলে সেটা অপরিবর্তিত থাকবে।
update public.profiles
set batch = 'Petro Special Foundation Training 2026'
where batch is null or batch ilike '%2025%' or batch ilike '%BIM%';

-- ============================================================
-- শেষ — migration সম্পন্ন ✅
-- এখন আপডেট/নোট/ডকুমেন্ট ট্যাব থেকে সেভ ও আপলোড কাজ করবে,
-- এবং প্রোফাইলে নতুন কাস্টম ফিল্ড যোগ করা যাবে।
-- ============================================================
