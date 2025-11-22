-- Create Events table
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Event Participants table
create table public.event_participants (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('going', 'maybe', 'not_going')) default 'going',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(event_id, user_id)
);

-- Enable RLS
alter table public.events enable row level security;
alter table public.event_participants enable row level security;

-- RLS Policies for Events

-- View events: Members of the squad can view events
create policy "Squad members can view events"
  on public.events for select
  using (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = events.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

-- Create events: Members of the squad can create events
create policy "Squad members can create events"
  on public.events for insert
  with check (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = events.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

-- Update/Delete events: Only the creator or squad leaders can update/delete (simplified to creator for now)
create policy "Creators can update their events"
  on public.events for update
  using ( auth.uid() = created_by );

create policy "Creators can delete their events"
  on public.events for delete
  using ( auth.uid() = created_by );

-- RLS Policies for Event Participants

-- View participants: Squad members can view participants
create policy "Squad members can view event participants"
  on public.event_participants for select
  using (
    exists (
      select 1 from public.events
      join public.squad_members on squad_members.squad_id = events.squad_id
      where events.id = event_participants.event_id
      and squad_members.user_id = auth.uid()
    )
  );

-- Manage participation: Users can manage their own participation
create policy "Users can manage their own participation"
  on public.event_participants for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );
