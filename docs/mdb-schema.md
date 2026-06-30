# Esquema real de DPSL_2024.MDB

Inspeccionado en modo solo lectura (sin leer datos personales, solo metadatos/agregados).

## Tabla: `DPSL_2024`

464 registros al momento de la inspección. `RecordID` es la clave primaria (única, no autonumber).

| Columna        | Tipo Access     | Uso                                                          |
|----------------|-----------------|---------------------------------------------------------------|
| RecordID       | Number (Double) | **PK**, secuencial 1..N. La app calcula `MAX(RecordID)+1` al insertar. |
| RECORD_        | Number (Double) | Contador histórico cross-anual (continúa de años anteriores). `MAX(RECORD_)+1`. |
| FIRST_NAME     | Text 255        | Nombre                                                         |
| LAST_NAME      | Text 255        | Apellido                                                       |
| TEAM_NAME      | Text 255        | Empresa / equipo                                               |
| I_D_           | Text 255        | Documento / ID                                                 |
| D_O_B_         | Text 255        | Fecha de nacimiento (texto libre, no tipo Date)                |
| Photo_1        | Text 255        | **Ruta de archivo** a la foto (no es BLOB)                     |
| SIGNATURE      | Text 255        | Ruta de archivo a la firma (opcional)                          |
| SHIRT_         | Number (Double) | Sin uso observado, siempre 0                                   |
| PrintCount     | Number (Double) | Lo setea el software de impresión al imprimir. 0 = no impreso. |
| PrintDateTime  | Text 255        | Lo setea el software de impresión                              |
| PrintBy        | Text 255        | Lo setea el software de impresión                              |
| VoidFlag       | Text 255        | No vacío = credencial anulada                                  |
| VoidDateTime   | Text 255        | Fecha de anulación                                              |
| VoidBy         | Text 255        | Usuario que anuló                                               |

## Reglas de inserción (usadas por `MdbPersonRepository`)

- `RecordID` y `RECORD_` se calculan como `MAX(columna) + 1` (no son autonumber de Access).
- Campos no usados por la nueva app se insertan vacíos: `PrintCount=0`, `PrintDateTime=''`, `PrintBy=''`, `VoidFlag=''`, `VoidDateTime=''`, `VoidBy=''`, `SHIRT_=0`.
- `Photo_1` / `SIGNATURE` deben contener una ruta que el software de impresión pueda leer. Configurar `PHOTOS_ABSOLUTE_BASE_PATH` en `.env` con la ruta real (local o UNC) antes de poner esto en producción.

## Estado derivado al leer

```
VoidFlag != ''      → Cancelado
PrintCount > 0       → Impreso
en otro caso         → Pendiente
```

## Campos de la app alineados 1:1 con el MDB

Tras detectar que el formulario tenía campos sin equivalente real (Departamento, Cargo, Número de
empleado, Fechas de ingreso/expiración, Tipo de credencial, Observaciones), se simplificó el modelo
de `persons` para que coincida exactamente con lo que existe en DPSL_2024.MDB:

| Campo app (SQLite) | Campo MDB    |
|---------------------|-------------|
| nombre               | FIRST_NAME  |
| apellido             | LAST_NAME   |
| equipo               | TEAM_NAME   |
| documento_id         | I_D_        |
| fecha_nacimiento     | D_O_B_      |
| numero_camiseta      | SHIRT_      |
| foto_path            | Photo_1     |
| firma_path           | SIGNATURE   |
| estado (derivado)    | PrintCount / VoidFlag |

QR y código de barras son generados (no son campos de entrada) y siempre usan `documento_id` como valor.
Ver migración `005_align_persons_with_mdb.sql`.

## Selección de base de datos activa y recuperación de datos

Desde **Configuración → Base de datos MDB** (solo Administrador), la app:

- Detecta automáticamente todos los `.mdb` presentes en la carpeta `base/` y permite elegir
  cuál está activa (se guarda en la tabla `settings`, sin reiniciar el servidor).
- Permite **importar** todos los registros del `.mdb` activo hacia la base SQLite propia
  (`POST /api/mdb/import`), incluyendo copia de fotos cuando la ruta original es accesible.
  La importación es idempotente: re-ejecutarla actualiza los registros existentes (vinculados
  por `mdb_record_id`) en vez de duplicarlos.
- Permite **ver en vivo** los registros del `.mdb` activo sin importarlos (`/pages/mdb-viewer.html`),
  útil para auditar antes de decidir importar.

Durante la importación, registros con `I_D_` vacío reciben un `documento_id` sintético
`MDB-{RecordID}`; el campo `tipo_credencial` se marca como `Importado`.

**Nota sobre integridad:** abrir el `.mdb` con el driver Jet/ACE OLEDB —incluso para un `SELECT`—
actualiza la fecha de modificación del archivo como efecto secundario normal del motor (no altera
filas ni el conteo de registros; verificado con `COUNT(*)` antes/después).

## Notas de verificación

El adaptador (`backend/src/infrastructure/database/mdb/MdbPersonRepository.js`) se probó contra una
**copia** del archivo real (nunca contra `DPSL_2024.MDB` directamente) insertando un registro de prueba
y confirmando RecordID/RECORD_ correctos y todos los campos mapeados. La copia de prueba fue eliminada
tras la verificación.

`node-adodb` requiere el driver `Microsoft.ACE.OLEDB.12.0` de 64 bits (ya presente en este sistema) y
debe abrirse con la opción `x64=true` (`ADODB.open(connString, true)`), de lo contrario usa el
`cscript.exe` de 32 bits (`SysWOW64`) y falla con "Provider cannot be found".
