-- Create Storage Bucket for Chat Images
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Chat images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'chat-images' );

create policy "Authenticated users can upload chat images."
  on storage.objects for insert
  with check ( bucket_id = 'chat-images' and auth.role() = 'authenticated' );
