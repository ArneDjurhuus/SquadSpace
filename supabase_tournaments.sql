-- Tournaments Table
create table if not exists public.tournaments (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  name text not null,
  description text,
  start_date timestamp with time zone not null,
  status text check (status in ('upcoming', 'ongoing', 'completed')) default 'upcoming',
  format text check (format in ('single_elimination', 'round_robin', 'points')) default 'single_elimination',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tournament Participants Table
create table if not exists public.tournament_participants (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('registered', 'eliminated', 'winner')) default 'registered',
  score int default 0,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tournament_id, user_id)
);

-- Enable RLS
alter table public.tournaments enable row level security;
alter table public.tournament_participants enable row level security;

-- RLS Policies for Tournaments
drop policy if exists "Squad members can view tournaments" on public.tournaments;
create policy "Squad members can view tournaments"
  on public.tournaments for select
  using (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = tournaments.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

drop policy if exists "Squad members can create tournaments" on public.tournaments;
create policy "Squad members can create tournaments"
  on public.tournaments for insert
  with check (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = tournaments.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

drop policy if exists "Creators can update their tournaments" on public.tournaments;
create policy "Creators can update their tournaments"
  on public.tournaments for update
  using (auth.uid() = created_by);

drop policy if exists "Creators can delete their tournaments" on public.tournaments;
create policy "Creators can delete their tournaments"
  on public.tournaments for delete
  using (auth.uid() = created_by);

-- RLS Policies for Tournament Participants
drop policy if exists "Squad members can view tournament participants" on public.tournament_participants;
create policy "Squad members can view tournament participants"
  on public.tournament_participants for select
  using (
    exists (
      select 1 from public.tournaments
      join public.squad_members on squad_members.squad_id = tournaments.squad_id
      where tournaments.id = tournament_participants.tournament_id
      and squad_members.user_id = auth.uid()
    )
  );

drop policy if exists "Squad members can join tournaments" on public.tournament_participants;
create policy "Squad members can join tournaments"
  on public.tournament_participants for insert
  with check (
    exists (
      select 1 from public.tournaments
      join public.squad_members on squad_members.squad_id = tournaments.squad_id
      where tournaments.id = tournament_participants.tournament_id
      and squad_members.user_id = auth.uid()
    )
  );

drop policy if exists "Participants can leave tournaments" on public.tournament_participants;
create policy "Participants can leave tournaments"
  on public.tournament_participants for delete
  using (auth.uid() = user_id);
