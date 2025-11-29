CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  tokens INTEGER NOT NULL DEFAULT 10,
  last_refilled TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but allow service role to access
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Function to check and consume rate limit token
-- Returns TRUE if allowed, FALSE if limited
CREATE OR REPLACE FUNCTION check_rate_limit(
  limit_key TEXT,
  max_tokens INTEGER,
  refill_rate_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  current_tokens INTEGER;
  last_refill TIMESTAMP WITH TIME ZONE;
  now_time TIMESTAMP WITH TIME ZONE := NOW();
  time_passed INTERVAL;
  tokens_to_add INTEGER;
  new_tokens INTEGER;
BEGIN
  -- Upsert to ensure row exists and lock it
  INSERT INTO rate_limits (key, tokens, last_refilled)
  VALUES (limit_key, max_tokens, now_time)
  ON CONFLICT (key) DO UPDATE
  SET key = EXCLUDED.key -- Dummy update to lock the row
  RETURNING tokens, last_refilled INTO current_tokens, last_refill;

  -- Calculate refill
  time_passed := now_time - last_refill;
  
  -- Avoid division by zero
  IF refill_rate_seconds <= 0 THEN
     tokens_to_add := 0;
  ELSE
     tokens_to_add := FLOOR(EXTRACT(EPOCH FROM time_passed) / refill_rate_seconds);
  END IF;
  
  -- Cap at max_tokens
  new_tokens := LEAST(max_tokens, current_tokens + tokens_to_add);
  
  IF new_tokens > 0 THEN
    -- Consume 1 token
    UPDATE rate_limits
    SET tokens = new_tokens - 1,
        -- Update last_refilled to maintain precise timing
        last_refilled = CASE 
          WHEN tokens_to_add > 0 THEN 
             CASE 
               -- If bucket became full, reset timer to now
               WHEN current_tokens + tokens_to_add >= max_tokens THEN now_time
               -- Otherwise advance by the exact time equivalent of tokens added
               ELSE last_refill + (tokens_to_add * refill_rate_seconds * INTERVAL '1 second')
             END
          ELSE last_refill 
        END
    WHERE key = limit_key;
    RETURN TRUE;
  ELSE
    -- No tokens left
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated, service_role;
