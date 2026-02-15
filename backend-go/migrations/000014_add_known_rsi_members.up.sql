CREATE TABLE known_rsi_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rsi_handle TEXT UNIQUE,
    last_synced_at DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME
);
