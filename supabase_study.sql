-- Study Feature Tables

-- Flashcard Decks Table
create table if not exists public.flashcard_decks (
  id uuid default uuid_generate_v4() primary key,
  squad_id uuid references public.squads(id) on delete cascade not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Flashcards Table
create table if not exists public.flashcards (
  id uuid default uuid_generate_v4() primary key,
  deck_id uuid references public.flashcard_decks(id) on delete cascade not null,
  front text not null,
  back text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;

-- RLS Policies for Decks
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

-- RLS Policies for Flashcards
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
