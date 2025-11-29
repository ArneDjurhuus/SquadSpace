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
  -- Lock the row for update to prevent race conditions
  SELECT tokens, last_refilled INTO current_tokens, last_refill
  FROM rate_limits
  WHERE key = limit_key
  FOR UPDATE;

  -- If no record, insert one
  IF NOT FOUND THEN
    INSERT INTO rate_limits (key, tokens, last_refilled)
    VALUES (limit_key, max_tokens - 1, now_time);
    RETURN TRUE;
  END IF;

  -- Calculate refill
  time_passed := now_time - last_refill;
  -- Calculate how many tokens to add based on time passed
  -- e.g. if refill_rate_seconds is 60 (1 token per minute)
  tokens_to_add := FLOOR(EXTRACT(EPOCH FROM time_passed) / refill_rate_seconds);
  
  -- Cap at max_tokens
  new_tokens := LEAST(max_tokens, current_tokens + tokens_to_add);
  
  IF new_tokens > 0 THEN
    -- Consume 1 token
    UPDATE rate_limits
    SET tokens = new_tokens - 1,
        -- Only update last_refilled if we added tokens, to avoid creeping
        last_refilled = CASE WHEN tokens_to_add > 0 THEN now_time ELSE last_refill END
    WHERE key = limit_key;
    RETURN TRUE;
  ELSE
    -- No tokens left
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
