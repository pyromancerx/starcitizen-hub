-- Create Player Bases table
CREATE TABLE player_bases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    planet TEXT,
    coordinates TEXT,
    capabilities JSON,
    inventory JSON,
    privacy_settings JSON,
    status TEXT DEFAULT 'active',
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_player_bases_user_id ON player_bases(user_id);
CREATE INDEX idx_player_bases_planet ON player_bases(planet);
