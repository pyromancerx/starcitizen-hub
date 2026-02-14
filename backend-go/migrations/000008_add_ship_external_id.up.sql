-- Add ExternalID and LastSyncedAt to ships for re-import support
ALTER TABLE ships ADD COLUMN external_id TEXT;
ALTER TABLE ships ADD COLUMN last_synced_at DATETIME;

-- Add unique index to prevent duplicates on re-import
CREATE UNIQUE INDEX idx_user_external ON ships(user_id, external_id) WHERE external_id IS NOT NULL;
