-- ============================================================
-- SQUADSPACE COMPLETE DATABASE SCHEMA
-- ============================================================
-- Run this file in Supabase SQL Editor to set up the complete database.
-- This file includes all tables, RLS policies, triggers, and functions.
-- Generated: November 29, 2025
-- ============================================================

-- ============================================================
-- PART 1: RESET & EXTENSIONS
-- ============================================================

-- Drop existing objects (in dependency order)
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_task_assigned on public.tasks;
drop trigger if exists polls_updated_at on polls;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_member_of(_squad_id uuid) cascade;
drop function if exists public.can_access_channel(_channel_id uuid) cascade;
drop function if exists public.handle_task_assignment() cascade;
drop function if exists public.update_polls_updated_at() cascade;
drop function if exists public.clear_expired_statuses() cascade;

-- Drop tables (in dependency order)
drop table if exists public.poll_votes cascade;
drop table if exists public.poll_options cascade;
drop table if exists public.polls cascade;
drop table if exists public.notifications cascade;
drop table if exists public.tournament_participants cascade;
drop table if exists public.tournaments cascade;
drop table if exists public.documents cascade;
drop table if exists public.flashcards cascade;
drop table if exists public.flashcard_decks cascade;
drop table if exists public.milestones cascade;
drop table if exists public.leaderboard_entries cascade;
drop table if exists public.lfg_participants cascade;
drop table if exists public.lfg_posts cascade;
drop table if exists public.task_comments cascade;
drop table if exists public.tasks cascade;
drop table if exists public.sprints cascade;
drop table if exists public.columns cascade;
drop table if exists public.boards cascade;
drop table if exists public.event_agenda_items cascade;
drop table if exists public.availability_responses cascade;
drop table if exists public.availability_slots cascade;
drop table if exists public.availability_polls cascade;
drop table if exists public.event_participants cascade;
drop table if exists public.events cascade;
drop table if exists public.reactions cascade;
drop table if exists public.messages cascade;
drop table if exists public.channels cascade;
drop table if exists public.squad_members cascade;
drop table if exists public.squads cascade;
drop table if exists public.profiles cascade;

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PART 2: CORE TABLES
-- ============================================================

-- User Profiles (extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  image text,
  bio text,
  status_emoji text,
  status_text text,
  status_expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on column public.profiles.status_emoji is 'User status emoji (e.g., 🔴, 🟢, 💼)';
comment on column public.profiles.status_text is 'User status message (e.g., "In a meeting", "Working from home")';
comment on column public.profiles.status_expires_at is 'When the status should automatically clear';

-- Squads
create table public.squads (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  category text,
  type text default 'OTHER' check (type in ('GAMING', 'STUDY', 'STARTUP', 'CREATIVE', 'SPORTS', 'BOOK_CLUB', 'FITNESS', 'OTHER')),
  settings jsonb default '{}'::jsonb,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  is_private boolean default false,
  capacity int default 50,
  image text,
  banner_url text,
  owner_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Squad Members
create table public.squad_members (
  id uuid default uuid_generate_v4() primary key,
  role text default 'MEMBER',
  user_id uuid references public.profiles(id) on delete cascade not null,
  squad_id uuid references public.squads(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, squad_id)
);

-- ============================================================
-- PART 3: CHAT TABLES
-- ============================================================

-- Channels
create table public.channels (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text default 'TEXT',
  squad_id uuid references public.squads(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  image_url text,
  channel_id uuid references public.channels(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reactions
create table public.reactions (
  id uuid default uuid_generate_v4() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(message_id, user_id, emoji)
);

-- ============================================================
-- PART 4: EVENTS TABLES
-- ============================================================

-- Events
create table public.events (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location text,
  is_template boolean default false,
  template_name text,
  coordinates jsonb,
  check_in_code text,
  max_participants int,
  meeting_url text,
  category text,
  recurrence_rule text,
  timezone text default 'UTC',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Event Participants
create table public.event_participants (
  id uuid default uuid_generate_v4() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('going', 'maybe', 'not_going', 'waitlist')) default 'going',
  checked_in_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(event_id, user_id)
);

-- Event Agenda Items
create table public.event_agenda_items (
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

-- Availability Polls
create table public.availability_polls (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Availability Slots
create table public.availability_slots (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references public.availability_polls(id) on delete cascade not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null
);

-- Availability Responses
create table public.availability_responses (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references public.availability_polls(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  slot_id uuid references public.availability_slots(id) on delete cascade not null,
  status text check (status in ('available', 'if_needed')) default 'available',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, slot_id)
);

-- ============================================================
-- PART 5: TASKS/KANBAN TABLES
-- ============================================================

-- Boards
create table public.boards (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Columns
create table public.columns (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  name text not null,
  order_index int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sprints
create table public.sprints (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  name text not null,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status text default 'PLANNED',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  column_id uuid references public.columns(id) on delete cascade not null,
  sprint_id uuid references public.sprints(id) on delete set null,
  title text not null,
  description text,
  priority text default 'MEDIUM',
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date timestamp with time zone,
  order_index int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Task Comments
create table public.task_comments (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- PART 6: POLLS & VOTING TABLES
-- ============================================================

-- Polls
create table public.polls (
  id uuid default gen_random_uuid() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  channel_id uuid references public.channels(id) on delete set null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  question text not null,
  description text,
  poll_type varchar(20) default 'single' check (poll_type in ('single', 'multiple')),
  is_anonymous boolean default false,
  allow_add_options boolean default false,
  ends_at timestamp with time zone,
  is_closed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Poll Options
create table public.poll_options (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references public.polls(id) on delete cascade not null,
  text text not null,
  added_by uuid references public.profiles(id) on delete set null,
  order_index integer default 0,
  created_at timestamp with time zone default now()
);

-- Poll Votes
create table public.poll_votes (
  id uuid default gen_random_uuid() primary key,
  poll_id uuid references public.polls(id) on delete cascade not null,
  option_id uuid references public.poll_options(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(poll_id, option_id, user_id)
);

-- ============================================================
-- PART 7: GAMING FEATURE TABLES
-- ============================================================

-- LFG Posts
create table public.lfg_posts (
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

-- LFG Participants
create table public.lfg_participants (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.lfg_posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);

-- Leaderboard Entries
create table public.leaderboard_entries (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score int default 0,
  wins int default 0,
  matches_played int default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(squad_id, user_id)
);

-- Tournaments
create table public.tournaments (
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

-- Tournament Participants
create table public.tournament_participants (
  id uuid default uuid_generate_v4() primary key,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('registered', 'eliminated', 'winner')) default 'registered',
  score int default 0,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tournament_id, user_id)
);

-- ============================================================
-- PART 8: STUDY FEATURE TABLES
-- ============================================================

-- Flashcard Decks
create table public.flashcard_decks (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Flashcards
create table public.flashcards (
  id uuid default uuid_generate_v4() primary key,
  deck_id uuid references public.flashcard_decks(id) on delete cascade not null,
  front text not null,
  back text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- PART 9: STARTUP FEATURE TABLES
-- ============================================================

-- Milestones (Roadmap)
create table public.milestones (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'planned' check (status in ('completed', 'in-progress', 'planned')),
  target_date timestamp with time zone,
  quarter text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- PART 10: DOCUMENTS TABLE
-- ============================================================

-- Documents
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  uploader_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  file_path text not null,
  size bigint not null,
  type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- PART 11: NOTIFICATIONS TABLE
-- ============================================================

-- Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text,
  link text,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================
-- PART 12: INDEXES
-- ============================================================

-- Polls indexes
create index if not exists idx_polls_squad_id on public.polls(squad_id);
create index if not exists idx_polls_channel_id on public.polls(channel_id);
create index if not exists idx_polls_created_by on public.polls(created_by);
create index if not exists idx_polls_ends_at on public.polls(ends_at);
create index if not exists idx_poll_options_poll_id on public.poll_options(poll_id);
create index if not exists idx_poll_votes_poll_id on public.poll_votes(poll_id);
create index if not exists idx_poll_votes_option_id on public.poll_votes(option_id);
create index if not exists idx_poll_votes_user_id on public.poll_votes(user_id);

-- Status expiration index
create index if not exists idx_profiles_status_expires_at 
on public.profiles(status_expires_at) 
where status_expires_at is not null;

-- ============================================================
-- PART 13: HELPER FUNCTIONS
-- ============================================================

-- Check squad membership (bypasses RLS to avoid recursion)
create or replace function public.is_member_of(_squad_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.squad_members
    where squad_id = _squad_id
    and user_id = auth.uid()
  );
$$;

-- Check channel access (bypasses RLS)
create or replace function public.can_access_channel(_channel_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.channels c
    join public.squad_members sm on sm.squad_id = c.squad_id
    where c.id = _channel_id
    and sm.user_id = auth.uid()
  );
$$;

grant execute on function public.can_access_channel to authenticated;
grant execute on function public.can_access_channel to service_role;

-- Clear expired user statuses
create or replace function public.clear_expired_statuses()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set 
    status_emoji = null,
    status_text = null,
    status_expires_at = null
  where status_expires_at is not null 
    and status_expires_at < now();
end;
$$;

grant execute on function public.clear_expired_statuses to authenticated;

-- Handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, image)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email, new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Handle task assignment notifications
create or replace function public.handle_task_assignment()
returns trigger as $$
begin
  if (NEW.assignee_id is not null and (OLD.assignee_id is null or OLD.assignee_id != NEW.assignee_id)) then
    insert into public.notifications (user_id, type, title, message, link)
    values (
      NEW.assignee_id,
      'TASK_ASSIGNED',
      'New Task Assigned',
      'You have been assigned to a new task.',
      '/dashboard'
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_task_assigned
  after insert or update of assignee_id
  on public.tasks
  for each row
  execute procedure public.handle_task_assignment();

-- Polls updated_at trigger
create or replace function update_polls_updated_at()
returns trigger as $$
begin
    NEW.updated_at = NOW();
    return NEW;
end;
$$ language plpgsql;

create trigger polls_updated_at
    before update on polls
    for each row
    execute function update_polls_updated_at();

-- ============================================================
-- PART 14: ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.reactions enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_agenda_items enable row level security;
alter table public.availability_polls enable row level security;
alter table public.availability_slots enable row level security;
alter table public.availability_responses enable row level security;
alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.sprints enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.lfg_posts enable row level security;
alter table public.lfg_participants enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_participants enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.milestones enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;

-- ============================================================
-- PART 15: RLS POLICIES - PROFILES
-- ============================================================

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- ============================================================
-- PART 16: RLS POLICIES - SQUADS
-- ============================================================

create policy "Squads are viewable by everyone if public."
  on public.squads for select
  using ( is_private = false );

create policy "Squads are viewable by members."
  on public.squads for select
  using (
    auth.uid() in (
      select user_id from public.squad_members where squad_id = id
    )
  );

create policy "Authenticated users can create squads."
  on public.squads for insert
  with check ( auth.role() = 'authenticated' );

create policy "Owners can update their squads."
  on public.squads for update
  using ( auth.uid() = owner_id );

-- ============================================================
-- PART 17: RLS POLICIES - SQUAD MEMBERS
-- ============================================================

create policy "Squad members are viewable by squad members."
  on public.squad_members for select
  using ( is_member_of(squad_id) );

create policy "Users can join squads."
  on public.squad_members for insert
  with check ( auth.role() = 'authenticated' );

-- ============================================================
-- PART 18: RLS POLICIES - CHANNELS
-- ============================================================

create policy "Channels are viewable by squad members."
  on public.channels for select
  using ( is_member_of(squad_id) );

create policy "Squad members can create channels."
  on public.channels for insert
  with check ( is_member_of(squad_id) );

create policy "Squad members can delete channels."
  on public.channels for delete
  using ( is_member_of(squad_id) );

-- ============================================================
-- PART 19: RLS POLICIES - MESSAGES
-- ============================================================

create policy "Messages are viewable by squad members."
  on public.messages for select
  using ( can_access_channel(channel_id) );

create policy "Squad members can send messages."
  on public.messages for insert
  with check ( can_access_channel(channel_id) );

create policy "Users can delete their own messages."
  on public.messages for delete
  using ( auth.uid() = sender_id );

-- ============================================================
-- PART 20: RLS POLICIES - REACTIONS
-- ============================================================

create policy "Reactions are viewable by squad members."
  on public.reactions for select
  using (
    exists (
      select 1 from public.messages
      where id = message_id
      and can_access_channel(channel_id)
    )
  );

create policy "Squad members can add reactions."
  on public.reactions for insert
  with check (
    exists (
      select 1 from public.messages
      where id = message_id
      and can_access_channel(channel_id)
    )
  );

create policy "Users can remove their own reactions."
  on public.reactions for delete
  using ( auth.uid() = user_id );

-- ============================================================
-- PART 21: RLS POLICIES - EVENTS
-- ============================================================

create policy "Squad members can view events"
  on public.events for select
  using (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = events.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Squad members can create events"
  on public.events for insert
  with check (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = events.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Creators can update their events"
  on public.events for update
  using ( auth.uid() = created_by );

create policy "Creators can delete their events"
  on public.events for delete
  using ( auth.uid() = created_by );

-- ============================================================
-- PART 22: RLS POLICIES - EVENT PARTICIPANTS
-- ============================================================

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

create policy "Users can manage their own participation"
  on public.event_participants for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- ============================================================
-- PART 23: RLS POLICIES - EVENT AGENDA ITEMS
-- ============================================================

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

-- ============================================================
-- PART 24: RLS POLICIES - AVAILABILITY POLLS
-- ============================================================

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

-- ============================================================
-- PART 25: RLS POLICIES - AVAILABILITY SLOTS
-- ============================================================

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

-- ============================================================
-- PART 26: RLS POLICIES - AVAILABILITY RESPONSES
-- ============================================================

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

-- ============================================================
-- PART 27: RLS POLICIES - BOARDS
-- ============================================================

create policy "Boards are viewable by squad members."
  on public.boards for select
  using (
    exists (
      select 1 from public.squad_members
      where squad_id = boards.squad_id
      and user_id = auth.uid()
    )
  );

create policy "Squad members can manage boards."
  on public.boards for all
  using (
    exists (
      select 1 from public.squad_members
      where squad_id = boards.squad_id
      and user_id = auth.uid()
    )
  );

-- ============================================================
-- PART 28: RLS POLICIES - COLUMNS
-- ============================================================

create policy "Columns are viewable by squad members."
  on public.columns for select
  using (
    exists (
      select 1 from public.boards
      join public.squad_members on squad_members.squad_id = boards.squad_id
      where boards.id = columns.board_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Squad members can manage columns."
  on public.columns for all
  using (
    exists (
      select 1 from public.boards
      join public.squad_members on squad_members.squad_id = boards.squad_id
      where boards.id = columns.board_id
      and squad_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- PART 29: RLS POLICIES - SPRINTS
-- ============================================================

create policy "Sprints are viewable by squad members."
  on public.sprints for select
  using (
    exists (
      select 1 from public.squad_members
      where squad_id = sprints.squad_id
      and user_id = auth.uid()
    )
  );

create policy "Squad members can manage sprints."
  on public.sprints for all
  using (
    exists (
      select 1 from public.squad_members
      where squad_id = sprints.squad_id
      and user_id = auth.uid()
    )
  );

-- ============================================================
-- PART 30: RLS POLICIES - TASKS
-- ============================================================

create policy "Tasks are viewable by squad members."
  on public.tasks for select
  using (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      join public.squad_members on squad_members.squad_id = boards.squad_id
      where columns.id = tasks.column_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Squad members can manage tasks."
  on public.tasks for all
  using (
    exists (
      select 1 from public.columns
      join public.boards on boards.id = columns.board_id
      join public.squad_members on squad_members.squad_id = boards.squad_id
      where columns.id = tasks.column_id
      and squad_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- PART 31: RLS POLICIES - TASK COMMENTS
-- ============================================================

create policy "Task comments are viewable by squad members."
  on public.task_comments for select
  using (
    exists (
      select 1 from public.tasks
      join public.columns on columns.id = tasks.column_id
      join public.boards on boards.id = columns.board_id
      join public.squad_members on squad_members.squad_id = boards.squad_id
      where tasks.id = task_comments.task_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Squad members can manage comments."
  on public.task_comments for all
  using (
    exists (
      select 1 from public.tasks
      join public.columns on columns.id = tasks.column_id
      join public.boards on boards.id = columns.board_id
      join public.squad_members on squad_members.squad_id = boards.squad_id
      where tasks.id = task_comments.task_id
      and squad_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- PART 32: RLS POLICIES - POLLS
-- ============================================================

create policy "Squad members can view polls" on public.polls
  for select using (
    exists (
      select 1 from squad_members 
      where squad_members.squad_id = polls.squad_id 
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Squad members can create polls" on public.polls
  for insert with check (
    exists (
      select 1 from squad_members 
      where squad_members.squad_id = polls.squad_id 
      and squad_members.user_id = auth.uid()
    )
    and created_by = auth.uid()
  );

create policy "Poll creators can update their polls" on public.polls
  for update using (created_by = auth.uid());

create policy "Poll creators can delete their polls" on public.polls
  for delete using (created_by = auth.uid());

-- ============================================================
-- PART 33: RLS POLICIES - POLL OPTIONS
-- ============================================================

create policy "Squad members can view poll options" on public.poll_options
  for select using (
    exists (
      select 1 from polls 
      join squad_members on squad_members.squad_id = polls.squad_id 
      where polls.id = poll_options.poll_id 
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Poll creators can add options" on public.poll_options
  for insert with check (
    exists (
      select 1 from polls 
      where polls.id = poll_options.poll_id 
      and (polls.created_by = auth.uid() or polls.allow_add_options = true)
    )
  );

create policy "Poll creators can delete options" on public.poll_options
  for delete using (
    exists (
      select 1 from polls 
      where polls.id = poll_options.poll_id 
      and polls.created_by = auth.uid()
    )
  );

-- ============================================================
-- PART 34: RLS POLICIES - POLL VOTES
-- ============================================================

create policy "Squad members can view votes" on public.poll_votes
  for select using (
    exists (
      select 1 from polls 
      join squad_members on squad_members.squad_id = polls.squad_id 
      where polls.id = poll_votes.poll_id 
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Squad members can vote" on public.poll_votes
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from polls 
      join squad_members on squad_members.squad_id = polls.squad_id 
      where polls.id = poll_votes.poll_id 
      and squad_members.user_id = auth.uid()
      and polls.is_closed = false
      and (polls.ends_at is null or polls.ends_at > now())
    )
  );

create policy "Users can remove their own votes" on public.poll_votes
  for delete using (
    user_id = auth.uid()
    and exists (
      select 1 from polls 
      where polls.id = poll_votes.poll_id 
      and polls.is_closed = false
      and (polls.ends_at is null or polls.ends_at > now())
    )
  );

-- ============================================================
-- PART 35: RLS POLICIES - GAMING FEATURES
-- ============================================================

-- LFG Posts
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

-- LFG Participants
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

-- Leaderboard Entries
create policy "Squad members can view leaderboard"
  on public.leaderboard_entries for select
  using (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = leaderboard_entries.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

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

-- Tournaments
create policy "Squad members can view tournaments"
  on public.tournaments for select
  using (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = tournaments.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Squad members can create tournaments"
  on public.tournaments for insert
  with check (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = tournaments.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Creators can update their tournaments"
  on public.tournaments for update
  using (auth.uid() = created_by);

create policy "Creators can delete their tournaments"
  on public.tournaments for delete
  using (auth.uid() = created_by);

-- Tournament Participants
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

create policy "Participants can leave tournaments"
  on public.tournament_participants for delete
  using (auth.uid() = user_id);

-- ============================================================
-- PART 36: RLS POLICIES - STUDY FEATURES
-- ============================================================

-- Flashcard Decks
create policy "Squad members can view decks"
  on public.flashcard_decks for select
  using (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = flashcard_decks.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Squad members can create decks"
  on public.flashcard_decks for insert
  with check (
    exists (
      select 1 from public.squad_members
      where squad_members.squad_id = flashcard_decks.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Creators can delete their decks"
  on public.flashcard_decks for delete
  using (auth.uid() = creator_id);

-- Flashcards
create policy "Squad members can view flashcards"
  on public.flashcards for select
  using (
    exists (
      select 1 from public.flashcard_decks
      join public.squad_members on squad_members.squad_id = flashcard_decks.squad_id
      where flashcard_decks.id = flashcards.deck_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Squad members can create flashcards"
  on public.flashcards for insert
  with check (
    exists (
      select 1 from public.flashcard_decks
      join public.squad_members on squad_members.squad_id = flashcard_decks.squad_id
      where flashcard_decks.id = flashcards.deck_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Creators can delete their flashcards"
  on public.flashcards for delete
  using (
    exists (
      select 1 from public.flashcard_decks
      where flashcard_decks.id = flashcards.deck_id
      and flashcard_decks.creator_id = auth.uid()
    )
  );

-- ============================================================
-- PART 37: RLS POLICIES - MILESTONES (ROADMAP)
-- ============================================================

create policy "Squad members can view milestones"
  on public.milestones for select
  using ( exists (
    select 1 from public.squad_members
    where squad_members.squad_id = milestones.squad_id
    and squad_members.user_id = auth.uid()
  ));

create policy "Squad leaders can manage milestones"
  on public.milestones for all
  using ( exists (
    select 1 from public.squad_members
    where squad_members.squad_id = milestones.squad_id
    and squad_members.user_id = auth.uid()
    and squad_members.role in ('LEADER', 'CO_LEADER')
  ));

-- ============================================================
-- PART 38: RLS POLICIES - DOCUMENTS
-- ============================================================

create policy "Squad members can view documents"
  on public.documents for select
  using (
    exists (
      select 1 from squad_members
      where squad_members.squad_id = documents.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Squad members can upload documents"
  on public.documents for insert
  with check (
    exists (
      select 1 from squad_members
      where squad_members.squad_id = documents.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

create policy "Users can delete their own documents"
  on public.documents for delete
  using (
    uploader_id = auth.uid()
    or exists (
      select 1 from squad_members
      where squad_members.squad_id = documents.squad_id
      and squad_members.user_id = auth.uid()
      and squad_members.role in ('owner', 'admin', 'LEADER', 'CO_LEADER')
    )
  );

-- ============================================================
-- PART 39: RLS POLICIES - NOTIFICATIONS
-- ============================================================

create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ============================================================
-- PART 40: STORAGE BUCKETS & POLICIES
-- ============================================================

-- Chat Images Bucket
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

-- Squad Documents Bucket
insert into storage.buckets (id, name, public)
values ('squad-documents', 'squad-documents', true)
on conflict (id) do nothing;

-- Storage Policies for chat-images
drop policy if exists "Chat images are publicly accessible." on storage.objects;
create policy "Chat images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'chat-images' );

drop policy if exists "Authenticated users can upload chat images." on storage.objects;
create policy "Authenticated users can upload chat images."
  on storage.objects for insert
  with check ( bucket_id = 'chat-images' and auth.role() = 'authenticated' );

-- Storage Policies for squad-documents
drop policy if exists "Documents are accessible by public" on storage.objects;
create policy "Documents are accessible by public"
  on storage.objects for select
  using ( bucket_id = 'squad-documents' );

drop policy if exists "Authenticated users can upload documents" on storage.objects;
create policy "Authenticated users can upload documents"
  on storage.objects for insert
  with check ( bucket_id = 'squad-documents' and auth.role() = 'authenticated' );

drop policy if exists "Authenticated users can delete documents" on storage.objects;
create policy "Authenticated users can delete documents"
  on storage.objects for delete
  using ( bucket_id = 'squad-documents' and auth.role() = 'authenticated' );

-- ============================================================
-- PART 41: REALTIME SUBSCRIPTIONS
-- ============================================================

-- Enable realtime for key tables
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table reactions;
alter publication supabase_realtime add table polls;
alter publication supabase_realtime add table poll_options;
alter publication supabase_realtime add table poll_votes;

-- ============================================================
-- PART 42: BACKFILL EXISTING USERS
-- ============================================================

-- Create profiles for any existing auth users that don't have profiles yet
insert into public.profiles (id, name, email, image)
select 
  id, 
  raw_user_meta_data ->> 'name', 
  email, 
  raw_user_meta_data ->> 'avatar_url'
from auth.users
where id not in (select id from public.profiles);

-- ============================================================
-- SCHEMA COMPLETE!
-- ============================================================
-- Features included:
-- ✅ User Profiles with Status
-- ✅ Squads (all types: Gaming, Study, Startup, etc.)
-- ✅ Squad Members with Roles
-- ✅ Chat (Channels, Messages, Reactions)
-- ✅ Events with Participants, Agenda, Availability Polling
-- ✅ Tasks/Kanban (Boards, Columns, Tasks, Comments, Sprints)
-- ✅ Polls & Voting
-- ✅ Gaming (LFG, Leaderboards, Tournaments)
-- ✅ Study (Flashcards)
-- ✅ Startup (Milestones/Roadmap)
-- ✅ Documents
-- ✅ Notifications
-- ✅ Storage Buckets
-- ============================================================
