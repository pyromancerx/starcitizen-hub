-- Star Citizen Hub - Master v1.0.0 Baseline Schema

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password_hash TEXT,
    rsi_handle TEXT UNIQUE,
    is_rsi_verified BOOLEAN DEFAULT 0,
    display_name TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    is_approved BOOLEAN DEFAULT 0,
    last_seen_at DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    custom_attributes JSON,
    notification_settings JSON
);

CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    tier TEXT DEFAULT 'custom',
    permissions JSON,
    is_default BOOLEAN DEFAULT 0,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role_id INTEGER,
    granted_by INTEGER,
    granted_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE ships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ship_type TEXT,
    name TEXT,
    serial_number TEXT,
    insurance_status TEXT,
    insurance_expires_at DATETIME,
    loadout JSON,
    notes TEXT,
    status TEXT DEFAULT 'ready',
    custom_attributes JSON,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE wallets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    balance_auec INTEGER DEFAULT 0,
    last_updated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id INTEGER,
    amount INTEGER,
    transaction_type TEXT,
    description TEXT,
    created_at DATETIME,
    FOREIGN KEY (wallet_id) REFERENCES wallets(id)
);

CREATE TABLE personal_inventories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    item_type TEXT,
    item_name TEXT,
    quantity INTEGER DEFAULT 1,
    location TEXT,
    custom_attributes JSON,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE org_stockpiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    description TEXT,
    resource_type TEXT,
    quantity REAL DEFAULT 0,
    unit TEXT DEFAULT 'units',
    min_threshold REAL,
    custom_attributes JSON,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE TABLE stockpile_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stockpile_id INTEGER,
    user_id INTEGER,
    quantity_change REAL,
    transaction_type TEXT,
    reason TEXT,
    created_at DATETIME,
    FOREIGN KEY (stockpile_id) REFERENCES org_stockpiles(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE trade_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    ship_id INTEGER,
    origin_location TEXT,
    destination_location TEXT,
    commodity TEXT,
    quantity REAL,
    buy_price_per_unit REAL,
    sell_price_per_unit REAL,
    profit REAL,
    completed_at DATETIME,
    notes TEXT,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (ship_id) REFERENCES ships(id)
);

CREATE TABLE cargo_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poster_id INTEGER,
    hauler_id INTEGER,
    origin_location TEXT,
    destination_location TEXT,
    commodity TEXT,
    quantity REAL,
    payment_amount INTEGER,
    deadline DATETIME,
    status TEXT DEFAULT 'open',
    created_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY (poster_id) REFERENCES users(id),
    FOREIGN KEY (hauler_id) REFERENCES users(id)
);

CREATE TABLE org_treasuries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    balance_auec INTEGER DEFAULT 0,
    last_updated_at DATETIME
);

CREATE TABLE treasury_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER,
    transaction_type TEXT,
    reason TEXT,
    user_id INTEGER,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    type TEXT,
    scheduled_at DATETIME,
    estimated_duration INTEGER,
    status TEXT DEFAULT 'planning',
    max_participants INTEGER,
    requirements TEXT,
    required_roles JSON,
    required_ship_types JSON,
    is_public BOOLEAN DEFAULT 1,
    created_by_id INTEGER,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE operation_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_id INTEGER,
    user_id INTEGER,
    ship_id INTEGER,
    role_preference TEXT,
    status TEXT DEFAULT 'signed_up',
    joined_at DATETIME,
    FOREIGN KEY (operation_id) REFERENCES operations(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (ship_id) REFERENCES ships(id)
);

CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'planning',
    manager_id INTEGER,
    start_date DATETIME,
    target_date DATETIME,
    completed_date DATETIME,
    custom_attributes JSON,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE project_phases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    name TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phase_id INTEGER,
    assignee_id INTEGER,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority INTEGER DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (phase_id) REFERENCES project_phases(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id)
);

CREATE TABLE contribution_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    resource_type TEXT,
    target_amount REAL,
    current_amount REAL DEFAULT 0,
    unit TEXT DEFAULT 'units',
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE contributions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER,
    user_id INTEGER,
    amount REAL,
    notes TEXT,
    created_at DATETIME,
    FOREIGN KEY (goal_id) REFERENCES contribution_goals(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE forum_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME
);

CREATE TABLE forum_threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    author_id INTEGER,
    title TEXT,
    is_pinned BOOLEAN DEFAULT 0,
    is_locked BOOLEAN DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (category_id) REFERENCES forum_categories(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE forum_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER,
    author_id INTEGER,
    content TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (thread_id) REFERENCES forum_threads(id),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER,
    user2_id INTEGER,
    last_message_at DATETIME,
    last_message_preview TEXT,
    last_message_sender_id INTEGER,
    unread_count_user1 INTEGER DEFAULT 0,
    unread_count_user2 INTEGER DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id)
);

CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER,
    sender_id INTEGER,
    content TEXT,
    is_read BOOLEAN DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE voice_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    description TEXT,
    is_private BOOLEAN DEFAULT 0,
    created_by_id INTEGER,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,
    FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    title TEXT,
    message TEXT,
    link TEXT,
    data JSON,
    priority TEXT DEFAULT 'normal',
    is_read BOOLEAN DEFAULT 0,
    read_at DATETIME,
    triggered_by_id INTEGER,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (triggered_by_id) REFERENCES users(id)
);

CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    user_id INTEGER,
    content JSON,
    related_id INTEGER,
    related_type TEXT,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    description TEXT,
    icon TEXT,
    rarity TEXT DEFAULT 'common',
    achievement_type TEXT DEFAULT 'custom',
    criteria JSON,
    points INTEGER DEFAULT 10,
    created_by_id INTEGER,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME,
    updated_at DATETIME
);

CREATE TABLE user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    achievement_id INTEGER,
    awarded_by_id INTEGER,
    award_note TEXT,
    awarded_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);

CREATE TABLE announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    author_id INTEGER,
    is_public BOOLEAN DEFAULT 1,
    is_pinned BOOLEAN DEFAULT 0,
    category TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE discord_integrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT UNIQUE,
    guild_name TEXT,
    bot_token TEXT,
    bot_client_id TEXT,
    bot_client_secret TEXT,
    oauth_enabled BOOLEAN DEFAULT 0,
    oauth_client_id TEXT,
    oauth_client_secret TEXT,
    webhook_url TEXT,
    webhook_enabled BOOLEAN DEFAULT 0,
    auto_post_settings JSON,
    role_sync_enabled BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME,
    updated_at DATETIME
);

CREATE TABLE discord_webhooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    webhook_url TEXT,
    event_types JSON,
    message_template TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME,
    updated_at DATETIME
);

CREATE TABLE user_discord_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    discord_id TEXT,
    discord_username TEXT,
    discord_discriminator TEXT,
    discord_avatar TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at DATETIME,
    guild_joined BOOLEAN DEFAULT 0,
    guild_joined_at DATETIME,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE discord_role_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    discord_role_id TEXT UNIQUE,
    discord_role_name TEXT,
    hub_role_id INTEGER,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (hub_role_id) REFERENCES roles(id)
);

CREATE TABLE rsi_verification_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    rsi_handle TEXT,
    screenshot_url TEXT,
    verification_code TEXT,
    status TEXT DEFAULT 'pending',
    admin_notes TEXT,
    submitted_at DATETIME,
    reviewed_at DATETIME,
    reviewed_by_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by_id) REFERENCES users(id)
);

CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at DATETIME
);

CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT,
    target_type TEXT,
    target_id INTEGER,
    details JSON,
    ip_address TEXT,
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
