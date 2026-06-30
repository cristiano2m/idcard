-- Simplifica el esquema de `persons` para que coincida exactamente con los
-- campos disponibles en la tabla DPSL_2024.MDB (ver docs/mdb-schema.md).

ALTER TABLE persons RENAME COLUMN empresa TO equipo;
ALTER TABLE persons ADD COLUMN numero_camiseta INTEGER;

DROP INDEX IF EXISTS idx_persons_empresa;
CREATE INDEX IF NOT EXISTS idx_persons_equipo ON persons(equipo);

ALTER TABLE persons DROP COLUMN departamento;
ALTER TABLE persons DROP COLUMN cargo;
ALTER TABLE persons DROP COLUMN numero_empleado;
ALTER TABLE persons DROP COLUMN fecha_ingreso;
ALTER TABLE persons DROP COLUMN fecha_expiracion;
ALTER TABLE persons DROP COLUMN tipo_credencial;
ALTER TABLE persons DROP COLUMN observaciones;
