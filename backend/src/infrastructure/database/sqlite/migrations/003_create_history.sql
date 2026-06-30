CREATE TABLE IF NOT EXISTS history (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    person_id         INTEGER REFERENCES persons(id),
    user_id           INTEGER REFERENCES users(id),
    accion            TEXT NOT NULL,
    estado_resultante TEXT,
    ip_address        TEXT,
    user_agent        TEXT,
    detalle           TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_history_person_id ON history(person_id);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at);
