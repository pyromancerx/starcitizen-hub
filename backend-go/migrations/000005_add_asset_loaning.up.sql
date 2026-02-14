-- Create Asset Loans table
CREATE TABLE asset_loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stockpile_id INTEGER,
    user_id INTEGER,
    operation_id INTEGER,
    quantity REAL,
    status TEXT DEFAULT 'active',
    loaned_at DATETIME,
    due_at DATETIME,
    returned_at DATETIME,
    notes TEXT,
    deleted_at DATETIME,
    FOREIGN KEY (stockpile_id) REFERENCES org_stockpiles(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (operation_id) REFERENCES operations(id)
);
