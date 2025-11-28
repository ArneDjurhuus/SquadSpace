-- Create Milestones table for Startup Squads
create table public.milestones (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'planned' check (status in ('completed', 'in-progress', 'planned')),
  target_date timestamp with time zone,
  quarter text, -- e.g., 'Q1 2024'
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.milestones enable row level security;

-- Policies
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
