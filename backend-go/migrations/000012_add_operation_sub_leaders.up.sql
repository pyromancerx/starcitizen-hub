-- Create Operation Sub Leaders table
CREATE TABLE operation_sub_leaders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_id INTEGER,
    user_id INTEGER,
    role_title TEXT,
    status TEXT DEFAULT 'candidate',
    joined_at DATETIME,
    FOREIGN KEY (operation_id) REFERENCES operations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
