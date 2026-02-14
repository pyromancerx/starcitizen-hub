-- Create Federation Entities table
CREATE TABLE federation_entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    sid TEXT UNIQUE,
    status TEXT DEFAULT 'neutral',
    description TEXT,
    logo_url TEXT,
    tactical_notes TEXT,
    last_encounter DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE INDEX idx_federation_status ON federation_entities(status);
