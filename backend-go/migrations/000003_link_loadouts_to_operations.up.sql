-- Create Equipment Manifests table
CREATE TABLE equipment_manifests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    items JSON,
    created_by_id INTEGER,
    is_standard_issue BOOLEAN DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);

-- Link Loadouts and Manifests to Operations
ALTER TABLE operations ADD COLUMN required_loadout_id INTEGER;
ALTER TABLE operations ADD COLUMN required_manifest_id INTEGER;
