-- Gaming Feature Tables

-- LFG Posts Table
create table if not exists public.lfg_posts (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  game text not null,
  mode text,
  description text,
  max_players int default 5,
  start_time timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LFG Participants Table
create table if not exists public.lfg_participants (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.lfg_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- Leaderboard Entries Table
create table if not exists public.leaderboard_entries (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score int default 0,
  wins int default 0,
  matches_played int default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(squad_id, user_id)
);

-- Enable RLS
alter table public.lfg_posts enable row level security;
alter table public.lfg_participants enable row level security;
alter table public.leaderboard_entries enable row level security;

-- RLS Policies for LFG Posts
create policy "Squad members can view LFG posts"
  on public.lfg_posts for select
  using (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = lfg_posts.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Squad members can create LFG posts"
  on public.lfg_posts for insert
  with check (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = lfg_posts.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Creators can delete their LFG posts"
  on public.lfg_posts for delete
  using (auth.uid() = creator_id);

-- RLS Policies for LFG Participants
create policy "Squad members can view LFG participants"
  on public.lfg_participants for select
  using (
    exists (
      select 1 from public.lfg_posts
      join public.squad_members on squad_members.squad_id = lfg_posts.squad_id
      where lfg_posts.id = lfg_participants.post_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Squad members can join LFG posts"
  on public.lfg_participants for insert
  with check (
    exists (
      select 1 from public.lfg_posts
      join public.squad_members on squad_members.squad_id = lfg_posts.squad_id
      where lfg_posts.id = lfg_participants.post_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Participants can leave LFG posts"
  on public.lfg_participants for delete
  using (auth.uid() = user_id);

-- RLS Policies for Leaderboard Entries
create policy "Squad members can view leaderboard"
  on public.leaderboard_entries for select
  using (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = leaderboard_entries.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

-- Only system/admin updates for leaderboard (for now, or allow self-update if that's the model)
-- Assuming updates happen via server actions with service role or specific logic, 
-- but for now let's allow members to update their own stats for simplicity or restrict it.
-- Let's restrict insert/update to authenticated users who are members, 
-- but ideally this should be more controlled.
create policy "Squad members can insert/update their own leaderboard entry"
  on public.leaderboard_entries for all
  using (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = leaderboard_entries.squad_id
      and squad_members.user_id = auth.uid()
    )
    and auth.uid() = user_id
  );
