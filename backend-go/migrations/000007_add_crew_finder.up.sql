-- Create Crew Finder table
CREATE TABLE crew_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ship_id INTEGER,
    title TEXT,
    description TEXT,
    activity_type TEXT,
    current_crew INTEGER DEFAULT 1,
    max_crew INTEGER DEFAULT 2,
    status TEXT DEFAULT 'active',
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (ship_id) REFERENCES ships(id)
);

CREATE INDEX idx_crew_posts_status ON crew_posts(status);
CREATE INDEX idx_crew_posts_activity ON crew_posts(activity_type);
