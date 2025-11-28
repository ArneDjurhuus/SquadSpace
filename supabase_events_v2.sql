-- Update Events Table
alter table public.events 
add column if not exists is_template boolean default false,
add column if not exists template_name text,
add column if not exists coordinates jsonb,
add column if not exists check_in_code text,
add column if not exists max_participants int,
add column if not exists meeting_url text,
add column if not exists category text,
add column if not exists recurrence_rule text,
add column if not exists timezone text default 'UTC';

-- Update Event Participants Table
alter table public.event_participants
add column if not exists checked_in_at timestamp with time zone;

-- Update status check constraint to include 'waitlist'
alter table public.event_participants drop constraint if exists event_participants_status_check;
alter table public.event_participants add constraint event_participants_status_check 
  check (status in ('going', 'maybe', 'not_going', 'waitlist'));

-- Availability Polling Tables
create table if not exists public.availability_polls (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.availability_slots (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references public.availability_polls(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null
);

create table if not exists public.availability_responses (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references public.availability_polls(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  slot_id uuid references public.availability_slots(id) on delete cascade not null,
  status text check (status in ('available', 'if_needed')) default 'available',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, slot_id)
);

-- Event Agenda Items
create table if not exists public.event_agenda_items (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  presenter_id uuid references public.profiles(id) on delete set null,
  order_index int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for new tables
alter table public.availability_polls enable row level security;
alter table public.availability_slots enable row level security;
alter table public.availability_responses enable row level security;
alter table public.event_agenda_items enable row level security;

-- RLS Policies for Availability Polling
create policy "Squad members can view availability polls"
  on public.availability_polls for select
  using (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = availability_polls.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Squad members can create availability polls"
  on public.availability_polls for insert
  with check (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = availability_polls.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Creators can update availability polls"
  on public.availability_polls for update
  using ( auth.uid() = created_by );

create policy "Creators can delete availability polls"
  on public.availability_polls for delete
  using ( auth.uid() = created_by );

-- RLS Policies for Availability Slots
create policy "Squad members can view availability slots"
  on public.availability_slots for select
  using (
    exists (
      select 1 from public.availability_polls
      join public.squad_members on squad_members.squad_id = availability_polls.squad_id
      where availability_polls.id = availability_slots.poll_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Poll creators can manage slots"
  on public.availability_slots for all
  using (
    exists (
      select 1 from public.availability_polls
      where availability_polls.id = availability_slots.poll_id
      and availability_polls.created_by = auth.uid()
    )
  );

-- RLS Policies for Availability Responses
create policy "Squad members can view availability responses"
  on public.availability_responses for select
  using (
    exists (
      select 1 from public.availability_polls
      join public.squad_members on squad_members.squad_id = availability_polls.squad_id
      where availability_polls.id = availability_responses.poll_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Users can manage their own responses"
  on public.availability_responses for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- RLS Policies for Agenda Items
create policy "Squad members can view agenda items"
  on public.event_agenda_items for select
  using (
    exists (
      select 1 from public.events
      join public.squad_members on squad_members.squad_id = events.squad_id
      where events.id = event_agenda_items.event_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Event creators can manage agenda items"
  on public.event_agenda_items for all
  using (
    exists (
      select 1 from public.events
      where events.id = event_agenda_items.event_id
      and events.created_by = auth.uid()
    )
  );
