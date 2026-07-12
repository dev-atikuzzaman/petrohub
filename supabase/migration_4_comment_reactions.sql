-- ============================================================
-- Petro Knowledge Hub — Migration 4
-- মন্তব্যে (comment) reaction যোগ করার জন্য নতুন টেবিল
-- ============================================================
-- Supabase Dashboard → SQL Editor → New Query তে পুরোটা পেস্ট করে Run করুন।
-- নিরাপদ (idempotent) — বারবার চালালেও সমস্যা নেই।
-- ============================================================

create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid references public.comments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique (comment_id, user_id)
);

create index if not exists idx_comment_reactions_comment_id on public.comment_reactions (comment_id);

alter table public.comment_reactions enable row level security;

drop policy if exists "comment_reactions_select_all" on public.comment_reactions;
create policy "comment_reactions_select_all"
  on public.comment_reactions for select
  to authenticated
  using (true);

drop policy if exists "comment_reactions_insert_own" on public.comment_reactions;
create policy "comment_reactions_insert_own"
  on public.comment_reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "comment_reactions_update_own" on public.comment_reactions;
create policy "comment_reactions_update_own"
  on public.comment_reactions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "comment_reactions_delete_own" on public.comment_reactions;
create policy "comment_reactions_delete_own"
  on public.comment_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'comment_reactions'
  ) then
    alter publication supabase_realtime add table public.comment_reactions;
  end if;
end $$;

-- ============================================================
-- শেষ ✅ — এখন মন্তব্যেও রিয়্যাক্ট করা যাবে
-- ============================================================
