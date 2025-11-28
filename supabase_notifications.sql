-- Create Notifications table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'TASK_ASSIGNED', 'EVENT_INVITE', 'SQUAD_INVITE', 'SYSTEM'
  title text not null,
  message text,
  link text,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Function to create notification on task assignment
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
      '/dashboard' -- Ideally this would link to the specific board/task
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for task assignment
drop trigger if exists on_task_assigned on public.tasks;
create trigger on_task_assigned
  after insert or update of assignee_id
  on public.tasks
  for each row
  execute procedure public.handle_task_assignment();
