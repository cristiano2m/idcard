CREATE TABLE IF NOT EXISTS mdb_updates (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id  INTEGER NOT NULL UNIQUE,
  equipo     TEXT,
  nombre     TEXT,
  apellido   TEXT,
  estado     TEXT NOT NULL DEFAULT 'Modificado' CHECK (estado IN ('Modificado', 'Impreso')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  printed_at TEXT
);
