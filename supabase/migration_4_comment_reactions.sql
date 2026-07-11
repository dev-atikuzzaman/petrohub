-- supabase/migration_4_comment_reactions.sql
-- মন্তব্যে (comment) ইমোজি রিয়্যাকশন যোগ করার জন্য নতুন টেবিল।
-- এটা public.reactions টেবিলের মতোই কাঠামো, শুধু post_id এর বদলে comment_id।
-- Supabase SQL Editor এ এই পুরো ফাইলটা রান করে দিন।

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

create policy "comment_reactions_select_all"
  on public.comment_reactions for select
  to authenticated
  using (true);

create policy "comment_reactions_insert_own"
  on public.comment_reactions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "comment_reactions_update_own"
  on public.comment_reactions for update
  to authenticated
  using (auth.uid() = user_id);

create policy "comment_reactions_delete_own"
  on public.comment_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

alter publication supabase_realtime add table public.comment_reactions;
