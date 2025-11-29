-- Performance indexes for SquadSpace
-- Add these indexes to improve query performance

-- Squad Members indexes (for membership checks and squad listings)
CREATE INDEX IF NOT EXISTS idx_squad_members_squad_id ON squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user_id ON squad_members(user_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_composite ON squad_members(squad_id, user_id);

-- Chat Messages indexes (for channel message queries)
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_composite ON chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- Tasks indexes (for board and assignee queries)
CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_composite ON tasks(board_id, status);

-- Events indexes (for squad event queries)
CREATE INDEX IF NOT EXISTS idx_events_squad_id ON events(squad_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_composite ON events(squad_id, start_time);

-- Event Participants indexes
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON event_participants(event_id, status);

-- Polls indexes
CREATE INDEX IF NOT EXISTS idx_polls_squad_id ON polls(squad_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);

-- Poll Votes indexes
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);

-- LFG Posts indexes
CREATE INDEX IF NOT EXISTS idx_lfg_posts_squad_id ON lfg_posts(squad_id);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_created_at ON lfg_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lfg_posts_status ON lfg_posts(status);

-- LFG Participants indexes
CREATE INDEX IF NOT EXISTS idx_lfg_participants_post_id ON lfg_participants(post_id);
CREATE INDEX IF NOT EXISTS idx_lfg_participants_user_id ON lfg_participants(user_id);

-- Tournaments indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_squad_id ON tournaments(squad_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(start_date);

-- Notifications indexes (for user notification queries)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_squad_id ON documents(squad_id);
CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents(parent_id);

-- Channels indexes
CREATE INDEX IF NOT EXISTS idx_channels_squad_id ON channels(squad_id);

-- Flashcard Sets indexes
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_squad_id ON flashcard_sets(squad_id);

-- Flashcards indexes
CREATE INDEX IF NOT EXISTS idx_flashcards_set_id ON flashcards(set_id);

-- Add composite index for faster squad member counts (addresses N+1 query)
CREATE INDEX IF NOT EXISTS idx_squad_members_count ON squad_members(squad_id) INCLUDE (user_id);

-- Comment on indexes for documentation
COMMENT ON INDEX idx_squad_members_composite IS 'Composite index for efficient squad membership checks';
COMMENT ON INDEX idx_chat_messages_composite IS 'Composite index for efficient channel message queries with ordering';
COMMENT ON INDEX idx_tasks_composite IS 'Composite index for efficient task board queries by status';
COMMENT ON INDEX idx_events_composite IS 'Composite index for efficient squad event queries with time ordering';
COMMENT ON INDEX idx_notifications_unread IS 'Partial index for efficient unread notification queries';
