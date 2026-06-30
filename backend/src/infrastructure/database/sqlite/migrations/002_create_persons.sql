CREATE TABLE IF NOT EXISTS persons (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    mdb_record_id       INTEGER UNIQUE,
    nombre              TEXT NOT NULL,
    apellido            TEXT NOT NULL,
    empresa             TEXT NOT NULL,
    departamento        TEXT,
    cargo               TEXT,
    documento_id        TEXT NOT NULL,
    numero_empleado     TEXT,
    fecha_nacimiento    TEXT,
    fecha_ingreso       TEXT,
    fecha_expiracion    TEXT,
    tipo_credencial     TEXT NOT NULL,
    observaciones       TEXT,
    foto_path           TEXT,
    firma_path          TEXT,
    qr_path             TEXT,
    qr_value            TEXT,
    barcode_value       TEXT,
    estado              TEXT NOT NULL DEFAULT 'Pendiente'
                        CHECK (estado IN ('Pendiente','Impreso','Cancelado')),
    created_by_user_id  INTEGER REFERENCES users(id),
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at          TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_persons_doc_active
    ON persons(documento_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_persons_nombre ON persons(nombre, apellido);
CREATE INDEX IF NOT EXISTS idx_persons_empresa ON persons(empresa);
CREATE INDEX IF NOT EXISTS idx_persons_estado ON persons(estado);
