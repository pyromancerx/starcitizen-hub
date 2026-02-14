-- Create Game Data tables for Loadouts
CREATE TABLE game_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE,
    name TEXT,
    category TEXT,
    sub_category TEXT,
    manufacturer TEXT,
    size INTEGER DEFAULT 0,
    grade TEXT,
    description TEXT,
    base_price REAL,
    stats JSON,
    locations JSON,
    source TEXT,
    last_synced_at DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE TABLE ship_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE,
    name TEXT UNIQUE,
    manufacturer TEXT,
    description TEXT,
    ship_class TEXT,
    mass REAL,
    cargo_capacity REAL,
    hardpoints JSON,
    base_stats JSON,
    last_synced_at DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE TABLE ship_loadouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ship_id INTEGER,
    operation_id INTEGER,
    template_name TEXT,
    ship_model_id INTEGER,
    created_by_id INTEGER,
    configuration JSON,
    notes TEXT,
    is_standard_issue BOOLEAN DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (ship_model_id) REFERENCES ship_models(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE INDEX idx_game_items_name ON game_items(name);
CREATE INDEX idx_game_items_category ON game_items(category);
CREATE INDEX idx_game_items_manufacturer ON game_items(manufacturer);
CREATE INDEX idx_ship_models_manufacturer ON ship_models(manufacturer);
