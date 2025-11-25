-- Reset Task Schema
drop table if exists public.task_comments cascade;
drop table if exists public.tasks cascade;
drop table if exists public.sprints cascade;
drop table if exists public.columns cascade;
drop table if exists public.boards cascade;

-- Create Boards table
create table public.boards (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Columns table (e.g., To Do, In Progress, Done)
create table public.columns (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  name text not null,
  order_index int not null, -- For ordering columns left-to-right
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Sprints table
create table public.sprints (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  name text not null,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status text default 'PLANNED', -- PLANNED, ACTIVE, COMPLETED
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Tasks table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  column_id uuid references public.columns(id) on delete cascade not null,
  sprint_id uuid references public.sprints(id) on delete set null, -- Optional link to sprint
  title text not null,
  description text,
  priority text default 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date timestamp with time zone,
  order_index int not null, -- For ordering tasks within a column
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Task Comments table
create table public.task_comments (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.sprints enable row level security;
alter table public.tasks enable row level security;
alter table public.task_comments enable row level security;

-- RLS Policies

-- Boards
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

-- Columns
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

-- Sprints
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

-- Tasks
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

-- Task Comments
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
