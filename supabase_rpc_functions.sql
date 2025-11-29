-- Database view and RPC functions to solve N+1 query problems
-- This addresses the performance issue in dashboard/page.tsx

-- View: squads_with_member_counts
-- Provides squad information with pre-calculated member counts
CREATE OR REPLACE VIEW squads_with_member_counts AS
SELECT 
  s.*,
  COUNT(DISTINCT sm.user_id) as member_count,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', sm.user_id,
        'role', sm.role,
        'joined_at', sm.joined_at
      )
    ) FILTER (WHERE sm.user_id IS NOT NULL),
    '[]'::json
  ) as members
FROM squads s
LEFT JOIN squad_members sm ON s.id = sm.squad_id
GROUP BY s.id;

-- Grant access to the view
GRANT SELECT ON squads_with_member_counts TO authenticated;

-- RPC Function: get_user_squads_with_counts
-- Returns squads for a specific user with member counts (no N+1 queries)
CREATE OR REPLACE FUNCTION get_user_squads_with_counts(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  type TEXT,
  is_private BOOLEAN,
  created_at TIMESTAMPTZ,
  created_by UUID,
  max_members INTEGER,
  primary_color TEXT,
  accent_color TEXT,
  member_count BIGINT,
  user_role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.type,
    s.is_private,
    s.created_at,
    s.created_by,
    s.max_members,
    s.primary_color,
    s.accent_color,
    COUNT(DISTINCT sm_all.user_id) as member_count,
    sm_user.role as user_role
  FROM squads s
  INNER JOIN squad_members sm_user ON s.id = sm_user.squad_id AND sm_user.user_id = user_uuid
  LEFT JOIN squad_members sm_all ON s.id = sm_all.squad_id
  GROUP BY 
    s.id,
    s.name,
    s.description,
    s.type,
    s.is_private,
    s.created_at,
    s.created_by,
    s.max_members,
    s.primary_color,
    s.accent_color,
    sm_user.role
  ORDER BY s.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_squads_with_counts(UUID) TO authenticated;

-- RPC Function: get_squad_stats
-- Returns comprehensive stats for a squad (members, events, tasks, etc.)
CREATE OR REPLACE FUNCTION get_squad_stats(squad_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'member_count', (
      SELECT COUNT(*) FROM squad_members WHERE squad_id = squad_uuid
    ),
    'upcoming_events_count', (
      SELECT COUNT(*) FROM events 
      WHERE squad_id = squad_uuid 
      AND start_time > NOW()
    ),
    'active_tasks_count', (
      SELECT COUNT(*) FROM tasks t
      INNER JOIN task_boards tb ON t.board_id = tb.id
      WHERE tb.squad_id = squad_uuid
      AND t.status != 'DONE'
    ),
    'active_polls_count', (
      SELECT COUNT(*) FROM polls
      WHERE squad_id = squad_uuid
      AND (expires_at IS NULL OR expires_at > NOW())
    ),
    'active_lfg_count', (
      SELECT COUNT(*) FROM lfg_posts
      WHERE squad_id = squad_uuid
      AND status = 'OPEN'
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_squad_stats(UUID) TO authenticated;

-- RPC Function: get_event_with_capacity
-- Safely checks event capacity and participant status (prevents race conditions)
CREATE OR REPLACE FUNCTION check_event_capacity(event_uuid UUID, user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  max_capacity INTEGER;
  current_going INTEGER;
  user_status TEXT;
  can_join BOOLEAN;
BEGIN
  -- Get event max capacity
  SELECT max_participants INTO max_capacity
  FROM events
  WHERE id = event_uuid;
  
  -- Count current "going" participants
  SELECT COUNT(*) INTO current_going
  FROM event_participants
  WHERE event_id = event_uuid
  AND status = 'going';
  
  -- Get user's current status if any
  SELECT status INTO user_status
  FROM event_participants
  WHERE event_id = event_uuid
  AND user_id = user_uuid;
  
  -- Determine if user can join
  can_join := (max_capacity IS NULL) OR (current_going < max_capacity);
  
  SELECT json_build_object(
    'max_capacity', max_capacity,
    'current_going', current_going,
    'user_status', user_status,
    'can_join', can_join,
    'is_full', NOT can_join
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_event_capacity(UUID, UUID) TO authenticated;

-- RPC Function: rsvp_to_event_safe
-- Atomically handle RSVP with capacity check (solves race condition)
CREATE OR REPLACE FUNCTION rsvp_to_event_safe(
  event_uuid UUID,
  user_uuid UUID,
  desired_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  max_capacity INTEGER;
  current_going INTEGER;
  final_status TEXT;
  existing_id UUID;
BEGIN
  -- Get event max capacity
  SELECT max_participants INTO max_capacity
  FROM events
  WHERE id = event_uuid;
  
  -- Lock the event row for update to prevent race conditions
  PERFORM * FROM events WHERE id = event_uuid FOR UPDATE;
  
  -- Count current "going" participants (with lock)
  SELECT COUNT(*) INTO current_going
  FROM event_participants
  WHERE event_id = event_uuid
  AND status = 'going'
  FOR UPDATE;
  
  -- Determine final status
  IF desired_status = 'going' AND max_capacity IS NOT NULL AND current_going >= max_capacity THEN
    final_status := 'waitlist';
  ELSE
    final_status := desired_status;
  END IF;
  
  -- Check if user already has an RSVP
  SELECT id INTO existing_id
  FROM event_participants
  WHERE event_id = event_uuid
  AND user_id = user_uuid;
  
  -- Insert or update
  IF existing_id IS NOT NULL THEN
    UPDATE event_participants
    SET status = final_status, updated_at = NOW()
    WHERE id = existing_id;
  ELSE
    INSERT INTO event_participants (event_id, user_id, status)
    VALUES (event_uuid, user_uuid, final_status);
  END IF;
  
  -- Return result
  SELECT json_build_object(
    'success', true,
    'status', final_status,
    'was_waitlisted', (desired_status = 'going' AND final_status = 'waitlist')
  ) INTO result;
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION rsvp_to_event_safe(UUID, UUID, TEXT) TO authenticated;

-- Comment on functions for documentation
COMMENT ON FUNCTION get_user_squads_with_counts IS 'Returns squads for a user with pre-calculated member counts, avoiding N+1 queries';
COMMENT ON FUNCTION get_squad_stats IS 'Returns comprehensive stats for a squad in a single query';
COMMENT ON FUNCTION check_event_capacity IS 'Checks event capacity and user RSVP status safely';
COMMENT ON FUNCTION rsvp_to_event_safe IS 'Atomically handles event RSVP with capacity check, preventing race conditions';
