
-- Ensure Realtime is enabled for messages and reactions
begin;
  -- Remove tables from publication to ensure clean state (optional, but safer to just set)
  -- alter publication supabase_realtime drop table messages;
  -- alter publication supabase_realtime drop table reactions;
  
  -- Add tables to publication
  -- We use 'alter publication ... add table' which might fail if already added, 
  -- so we can use 'set table' to define the exact list we want, 
  -- assuming we only want these two for now (or we can try to preserve others).
  -- Since this is a dedicated app, we probably control the publication.
  
  alter publication supabase_realtime set table messages, reactions;
commit;
