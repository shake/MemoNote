ALTER TABLE notes ADD COLUMN pinned_at INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_notes_pinned_at
ON notes(pinned_at DESC, updated_at DESC);
