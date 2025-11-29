-- Create Documents Table
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  squad_id uuid references squads(id) on delete cascade not null,
  uploader_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  file_path text not null,
  size bigint not null,
  type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table documents enable row level security;

-- Policies for Documents Table

-- View: Squad members can view documents
create policy "Squad members can view documents"
  on documents for select
  using (
    exists (
      select 1 from squad_members
      where squad_members.squad_id = documents.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

-- Insert: Squad members can upload documents
create policy "Squad members can upload documents"
  on documents for insert
  with check (
    exists (
      select 1 from squad_members
      where squad_members.squad_id = documents.squad_id
      and squad_members.user_id = auth.uid()
    )
  );

-- Delete: Uploader or Squad Admin/Owner can delete
create policy "Users can delete their own documents"
  on documents for delete
  using (
    uploader_id = auth.uid()
    or exists (
      select 1 from squad_members
      where squad_members.squad_id = documents.squad_id
      and squad_members.user_id = auth.uid()
      and squad_members.role in ('owner', 'admin')
    )
  );

-- Storage Bucket Setup
insert into storage.buckets (id, name, public)
values ('squad-documents', 'squad-documents', true)
on conflict (id) do nothing;

-- Storage Policies

-- View: Public (or restricted to squad members if we want strict privacy, but public is easier for download links)
-- Let's restrict to authenticated users for now to be safe, or rely on the signed URL if private.
-- Since we set public=true above, anyone with the URL can download. 
-- Let's stick to public=true for simplicity of access, but we can add RLS to storage.objects if needed.
create policy "Documents are accessible by public"
  on storage.objects for select
  using ( bucket_id = 'squad-documents' );

-- Upload: Authenticated users can upload
create policy "Authenticated users can upload documents"
  on storage.objects for insert
  with check ( bucket_id = 'squad-documents' and auth.role() = 'authenticated' );

-- Delete: Authenticated users can delete (we rely on app logic to verify ownership, or we can add complex RLS here)
create policy "Authenticated users can delete documents"
  on storage.objects for delete
  using ( bucket_id = 'squad-documents' and auth.role() = 'authenticated' );
