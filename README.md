# Sistema Web de Registro de Credenciales PVC

Aplicación web para registrar personas desde cualquier dispositivo de la red local o Internet,
sin modificar el sistema existente de impresión de credenciales PVC. Ver requisitos originales en
[recursos/requisitos.md](recursos/requisitos.md) y el esquema real descubierto en
[docs/mdb-schema.md](docs/mdb-schema.md).

## Arquitectura

Clean Architecture con patrón Repository:

- `backend/src/domain` — entidades, interfaces de repositorio, errores (sin dependencias externas)
- `backend/src/application` — casos de uso y servicios de negocio
- `backend/src/infrastructure` — SQLite, MDB, JWT, logging, config, storage
- `backend/src/presentation` — Express: rutas, controllers, middleware
- `frontend/` — HTML5 + Bootstrap 5 + JS vanilla, multi-página

La base de datos propia (SQLite) guarda el registro completo de cada persona, con los **mismos
campos** que la tabla del MDB real (ver [docs/mdb-schema.md](docs/mdb-schema.md)). En modo
`DB_DRIVER=mdb-hybrid`, tanto las altas como las ediciones de personas se sincronizan también hacia
el MDB real (`base/DPSL_2024.MDB` u otro activo), sin modificar su estructura. La base activa es
configurable desde Configuración → Base de datos MDB, sin reiniciar el servidor.

## Arrancar en desarrollo

```bash
cd backend
npm install
copy .env.example .env     # ajustar JWT_SECRET
npm start
```

Servidor en `http://localhost:3000`. Usuario inicial: `admin` / `Admin1234!` (cambiar tras el primer login).

- Frontend: `http://localhost:3000/pages/login.html`
- API docs (Swagger): `http://localhost:3000/api/docs`
- Health check: `http://localhost:3000/health`

## Variables de entorno clave (`backend/.env`)

| Variable | Descripción |
|---|---|
| `DB_DRIVER` | `sqlite` (solo base propia) o `mdb-hybrid` (también escribe en el MDB real) |
| `JWT_SECRET` | Clave para firmar sesiones, obligatoria en producción |
| `PHOTOS_ABSOLUTE_BASE_PATH` | Ruta absoluta donde el software de impresión leerá las fotos (solo `mdb-hybrid`) |
| `CORS_ORIGINS` | Orígenes permitidos, útil con Cloudflare Tunnel |

## Pasar a producción / mdb-hybrid

1. Confirmar que el software de impresión está cerrado o no bloquea el archivo `.mdb` durante la prueba.
2. Configurar `PHOTOS_ABSOLUTE_BASE_PATH` con la ruta que el software de impresión espera.
3. Cambiar `DB_DRIVER=mdb-hybrid` en `.env`.
4. Crear una persona de prueba y confirmar en el MDB real (o mejor, en una copia) que el registro aparece correctamente.
5. Ver [docs/windows-service.md](docs/windows-service.md) para correrlo como servicio Windows.

## Estructura de carpetas

Ver el árbol completo y la justificación de cada capa en el plan de implementación original
(`backend/src/{domain,application,infrastructure,presentation}`).
