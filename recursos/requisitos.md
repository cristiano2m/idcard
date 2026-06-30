# Sistema Web para Registro de Credenciales PVC
## Integración con Sistema Existente basado en Microsoft Access (.MDB)

# Objetivo

Desarrollar una aplicación web moderna que permita registrar personas desde cualquier computadora de la red local o por Internet sin modificar el sistema existente de impresión de credenciales PVC.

El sistema actual continuará siendo utilizado únicamente para la impresión de las tarjetas.

La nueva aplicación únicamente insertará registros dentro de la base de datos Microsoft Access (.MDB) utilizada por el software actual.

---

# Arquitectura General

                    Internet / LAN
                           │
                  Navegador Web
                           │
                 HTML + Bootstrap
                           │
                    API REST
                  (PHP o NodeJS)
                           │
                 ODBC / OLEDB Driver
                           │
               Microsoft Access (.MDB)
                           │
               Software actual de impresión
                           │
                    Impresora PVC

---

# Objetivos del Proyecto

- Mantener funcionando el sistema actual.
- No modificar el software de impresión.
- Registrar personas desde múltiples computadoras.
- Poder utilizar la aplicación desde celulares y tablets.
- Escalable para futuro.
- Preparado para migrar posteriormente a SQL Server o MySQL.

---

# Tecnologías

## Frontend

- HTML5
- Bootstrap 5
- JavaScript
- AJAX
- Responsive Design

## Backend

Puede desarrollarse en cualquiera de estas opciones:

Opción recomendada:

NodeJS
Express

o

PHP 8

---

## Base de datos

Microsoft Access (.MDB)

Conexión mediante:

- ODBC
- OLE DB

---

# Funcionalidades

## Login

Usuarios

Administrador

Operador

Supervisor

---

## Dashboard

Mostrar

Total registrados

Credenciales impresas

Pendientes

Últimos registros

---

## Registro de Persona

Campos configurables

Nombre

Apellido

Empresa

Departamento

Cargo

ID

Número de empleado

Fecha de ingreso

Fecha de expiración

Tipo de credencial

Observaciones

Fotografía

Firma (opcional)

Código QR

Código de Barras

---

## Fotografía

Permitir

Subir archivo

o

Capturar desde Webcam

Guardar

Ruta

o

BLOB

(según utilice el sistema actual)

---

## Búsqueda

Buscar por

Nombre

Empresa

Número

Código

Fecha

---

## Historial

Mostrar

Fecha

Usuario

Computadora

Estado

Impreso

Pendiente

Cancelado

---

## Administración

Usuarios

Roles

Permisos

Configuración

---

# Integración con Access

La aplicación NO modifica la estructura existente.

Debe conectarse al archivo MDB.

Leer tablas existentes.

Insertar únicamente los registros necesarios.

No eliminar registros.

No modificar información utilizada por el software de impresión.

---

# Sincronización

Cuando el usuario presione

Guardar

La aplicación deberá

Validar datos

Guardar fotografía

Insertar registro

Confirmar inserción

Mostrar mensaje exitoso

El software de impresión simplemente deberá refrescar su información.

---

# Acceso

Debe funcionar

Red Local

Internet

VPN

Cloudflare Tunnel (opcional)

---

# Seguridad

Login obligatorio

Contraseñas cifradas

Control de sesiones

Logs

Registro de actividad

Permisos por usuario

---

# Diseño

Bootstrap moderno

Modo claro

Responsive

Compatible con

Chrome

Edge

Firefox

Safari

---

# Flujo

Usuario

↓

Login

↓

Dashboard

↓

Nuevo Registro

↓

Capturar Foto

↓

Guardar

↓

Insertar en MDB

↓

Sistema actual detecta nuevo registro

↓

Impresión

---

# Carpetas del Proyecto

project/

    backend/

        controllers/

        routes/

        services/

        middleware/

        database/

        uploads/

    frontend/

        css/

        js/

        images/

        pages/

    config/

    logs/

    docs/

---

# API

POST

/api/person

Crear persona

GET

/api/person

Listado

GET

/api/person/{id}

Detalle

PUT

/api/person/{id}

Editar

DELETE

/api/person/{id}

Eliminar (opcional)

---

# Validaciones

Todos los campos obligatorios

Validar longitud

Validar formato

Validar fotografía

Evitar duplicados

---

# Escalabilidad

La aplicación debe diseñarse utilizando una arquitectura desacoplada.

Toda la lógica de acceso a datos debe concentrarse en una única capa.

En el futuro únicamente deberá cambiar el driver de base de datos para migrar de MDB hacia

SQL Server

MySQL

PostgreSQL

sin modificar el frontend.

---

# Mejoras Futuras

Captura de huella

Firma digital

Escaneo de documentos

Lector QR

Lector RFID

Lector NFC

Notificaciones

Impresión automática

Exportar PDF

Exportar Excel

API pública

---

# Información pendiente

Claude deberá esperar la estructura del archivo MDB para identificar:

- Tablas
- Relaciones
- Llaves primarias
- Llaves foráneas
- Campos obligatorios
- Forma en que se almacenan las fotografías
- Restricciones

Una vez disponible el archivo MDB se generará automáticamente el mapeo de tablas y la capa de acceso a datos.

---

# Recomendaciones para Claude Code

- Utilizar una arquitectura limpia (Clean Architecture).
- Separar completamente frontend y backend.
- Implementar patrón Repository para el acceso a la base de datos.
- Centralizar la conexión al archivo `.mdb` mediante un servicio.
- Crear una capa de configuración para facilitar la futura migración a SQL Server, MySQL o PostgreSQL.
- Documentar la API con OpenAPI/Swagger.
- Preparar el proyecto para ejecutarse como servicio en Windows.
- El código debe ser modular, escalable y mantenible.
- Incluir manejo robusto de errores y registros (logs).

# Fase 1

Crear toda la aplicación web.

# Fase 2

Conectar al archivo MDB.

# Fase 3

Leer tablas.

# Fase 4

Insertar registros.

# Fase 5

Pruebas con el software de impresión existente.

# Resultado esperado

Una aplicación web moderna que permita registrar personas desde cualquier dispositivo, escribiendo directamente en la base de datos Microsoft Access (.MDB), manteniendo intacto el sistema actual de impresión de credenciales PVC.