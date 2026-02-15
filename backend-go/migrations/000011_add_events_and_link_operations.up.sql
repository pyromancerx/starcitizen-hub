-- Create Events table
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    start_time DATETIME,
    end_time DATETIME,
    location TEXT,
    type TEXT,
    created_by_id INTEGER,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);

-- Link Operations to Events
ALTER TABLE operations ADD COLUMN event_id INTEGER REFERENCES events(id);
