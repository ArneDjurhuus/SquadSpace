-- SquadSpace Polls & Voting Schema
-- Run this after supabase_schema.sql

-- ===========================================
-- POLLS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    description TEXT,
    poll_type VARCHAR(20) DEFAULT 'single' CHECK (poll_type IN ('single', 'multiple')),
    is_anonymous BOOLEAN DEFAULT false,
    allow_add_options BOOLEAN DEFAULT false,
    ends_at TIMESTAMP WITH TIME ZONE,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- POLL OPTIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    added_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- POLL VOTES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, option_id, user_id)
);

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_polls_squad_id ON polls(squad_id);
CREATE INDEX IF NOT EXISTS idx_polls_channel_id ON polls(channel_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by);
CREATE INDEX IF NOT EXISTS idx_polls_ends_at ON polls(ends_at);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_option_id ON poll_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);

-- ===========================================
-- UPDATED_AT TRIGGER
-- ===========================================
CREATE OR REPLACE FUNCTION update_polls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS polls_updated_at ON polls;
CREATE TRIGGER polls_updated_at
    BEFORE UPDATE ON polls
    FOR EACH ROW
    EXECUTE FUNCTION update_polls_updated_at();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls policies
DROP POLICY IF EXISTS "Squad members can view polls" ON polls;
CREATE POLICY "Squad members can view polls" ON polls
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM squad_members 
            WHERE squad_members.squad_id = polls.squad_id 
            AND squad_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Squad members can create polls" ON polls;
CREATE POLICY "Squad members can create polls" ON polls
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM squad_members 
            WHERE squad_members.squad_id = polls.squad_id 
            AND squad_members.user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

DROP POLICY IF EXISTS "Poll creators can update their polls" ON polls;
CREATE POLICY "Poll creators can update their polls" ON polls
    FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Poll creators can delete their polls" ON polls;
CREATE POLICY "Poll creators can delete their polls" ON polls
    FOR DELETE USING (created_by = auth.uid());

-- Poll options policies
DROP POLICY IF EXISTS "Squad members can view poll options" ON poll_options;
CREATE POLICY "Squad members can view poll options" ON poll_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM polls 
            JOIN squad_members ON squad_members.squad_id = polls.squad_id 
            WHERE polls.id = poll_options.poll_id 
            AND squad_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Poll creators can add options" ON poll_options;
CREATE POLICY "Poll creators can add options" ON poll_options
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_options.poll_id 
            AND (polls.created_by = auth.uid() OR polls.allow_add_options = true)
        )
    );

DROP POLICY IF EXISTS "Poll creators can delete options" ON poll_options;
CREATE POLICY "Poll creators can delete options" ON poll_options
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_options.poll_id 
            AND polls.created_by = auth.uid()
        )
    );

-- Poll votes policies
DROP POLICY IF EXISTS "Squad members can view votes" ON poll_votes;
CREATE POLICY "Squad members can view votes" ON poll_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM polls 
            JOIN squad_members ON squad_members.squad_id = polls.squad_id 
            WHERE polls.id = poll_votes.poll_id 
            AND squad_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Squad members can vote" ON poll_votes;
CREATE POLICY "Squad members can vote" ON poll_votes
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM polls 
            JOIN squad_members ON squad_members.squad_id = polls.squad_id 
            WHERE polls.id = poll_votes.poll_id 
            AND squad_members.user_id = auth.uid()
            AND polls.is_closed = false
            AND (polls.ends_at IS NULL OR polls.ends_at > NOW())
        )
    );

DROP POLICY IF EXISTS "Users can remove their own votes" ON poll_votes;
CREATE POLICY "Users can remove their own votes" ON poll_votes
    FOR DELETE USING (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM polls 
            WHERE polls.id = poll_votes.poll_id 
            AND polls.is_closed = false
            AND (polls.ends_at IS NULL OR polls.ends_at > NOW())
        )
    );

-- ===========================================
-- REALTIME SUBSCRIPTIONS
-- ===========================================
ALTER PUBLICATION supabase_realtime ADD TABLE polls;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_options;
ALTER PUBLICATION supabase_realtime ADD TABLE poll_votes;
