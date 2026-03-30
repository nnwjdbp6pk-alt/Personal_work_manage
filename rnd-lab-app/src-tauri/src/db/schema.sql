-- R&D Lab Manager - SQLite Schema
-- Initialization strategy: CREATE IF NOT EXISTS on app startup

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused', 'archived')),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS experiments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    batch_code TEXT NOT NULL DEFAULT '',
    objective TEXT NOT NULL DEFAULT '',
    observation_md TEXT NOT NULL DEFAULT '',
    result_summary TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS formulation_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    experiment_id INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    material_name TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'g',
    role TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS process_conditions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    experiment_id INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    temperature REAL,
    mixing_time REAL,
    mixing_speed REAL,
    ph REAL,
    aging_time REAL,
    memo TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS property_measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    experiment_id INTEGER NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    property_name TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT '',
    test_method TEXT NOT NULL DEFAULT '',
    memo TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS inventory_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    log_type TEXT NOT NULL CHECK(log_type IN ('IN', 'OUT')),
    quantity REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT '',
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    experiment_id INTEGER REFERENCES experiments(id) ON DELETE SET NULL,
    memo TEXT NOT NULL DEFAULT ''
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_experiments_project ON experiments(project_id);
CREATE INDEX IF NOT EXISTS idx_inventory_date ON inventory_logs(date);
CREATE INDEX IF NOT EXISTS idx_inventory_item ON inventory_logs(item_name);
CREATE INDEX IF NOT EXISTS idx_inventory_project ON inventory_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_property_experiment ON property_measurements(experiment_id);
