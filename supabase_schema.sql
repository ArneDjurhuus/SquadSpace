-- Reset Database Schema
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_member_of(_squad_id uuid) cascade;

drop table if exists public.messages cascade;
drop table if exists public.channels cascade;
drop table if exists public.squad_members cascade;
drop table if exists public.squads cascade;
drop table if exists public.profiles cascade;
drop table if exists public.reactions cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create User Profile table (extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Squads table
create table public.squads (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  category text,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  is_private boolean default false,
  capacity int default 50,
  image text,
  owner_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Squad Members table
create table public.squad_members (
  id uuid default uuid_generate_v4() primary key,
  role text default 'MEMBER', -- LEADER, CO_LEADER, MEMBER, GUEST
  user_id uuid references public.profiles(id) on delete cascade not null,
  squad_id uuid references public.squads(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, squad_id)
);

-- Create Channels table
create table public.channels (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text default 'TEXT', -- TEXT, VOICE
  squad_id uuid references public.squads(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  image_url text,
  channel_id uuid references public.channels(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Reactions table
create table public.reactions (
  id uuid default uuid_generate_v4() primary key,
  message_id uuid references public.messages(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(message_id, user_id, emoji)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.squads enable row level security;
alter table public.squad_members enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.reactions enable row level security;

-- RLS Policies

-- Profiles: Public read, Owner update
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Squads: Public read (if not private), Members read (if private), Owner update/delete
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

-- Helper function to check squad membership (bypasses RLS to avoid recursion)
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

-- Squad Members: Members read, Leaders update
create policy "Squad members are viewable by squad members."
  on public.squad_members for select
  using (
    is_member_of(squad_id)
  );

create policy "Users can join squads."
  on public.squad_members for insert
  with check ( auth.role() = 'authenticated' );

-- Trigger to handle new user signup
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

-- Enable Realtime for Messages
alter publication supabase_realtime add table messages;

-- Backfill profiles for existing users (fixes foreign key error after reset)
insert into public.profiles (id, name, email, image)
select 
  id, 
  raw_user_meta_data ->> 'name', 
  email, 
  raw_user_meta_data ->> 'avatar_url'
from auth.users
where id not in (select id from public.profiles);

-- Channels Policies
create policy "Channels are viewable by squad members."
  on public.channels for select
  using ( is_member_of(squad_id) );

create policy "Squad members can create channels."
  on public.channels for insert
  with check ( is_member_of(squad_id) );

-- Helper function to check channel access (bypasses RLS)
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

-- Messages Policies
create policy "Messages are viewable by squad members."
  on public.messages for select
  using ( can_access_channel(channel_id) );

create policy "Squad members can send messages."
  on public.messages for insert
  with check ( can_access_channel(channel_id) );

-- Reactions Policies
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
