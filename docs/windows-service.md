# Ejecutar como servicio de Windows

## Opción A: node-windows

```bash
npm install -g node-windows
npm link node-windows
```

Crear `backend/install-service.js`:

```js
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'IDCard Backend',
  description: 'Sistema Web de Registro de Credenciales PVC',
  script: require('path').join(__dirname, 'server.js'),
  env: [{ name: 'NODE_ENV', value: 'production' }],
});

svc.on('install', () => svc.start());
svc.install();
```

Ejecutar `node install-service.js` una vez (requiere permisos de administrador).

## Opción B: NSSM (recomendada, más simple)

1. Descargar NSSM (https://nssm.cc).
2. `nssm install IDCardBackend "C:\Program Files\nodejs\node.exe" "C:\Projects\IDCard\backend\server.js"`
3. Configurar `Startup directory` = `C:\Projects\IDCard\backend`.
4. `nssm set IDCardBackend AppEnvironmentExtra NODE_ENV=production`
5. `nssm start IDCardBackend`

## Recomendaciones

- Usar `config/production.json` (`isHttps: true`, `sameSitePolicy: "none"`) si se expone vía
  Cloudflare Tunnel o reverse proxy HTTPS.
- Configurar `.env` con `JWT_SECRET` fuerte y único antes de pasar a producción.
- Revisar `PHOTOS_ABSOLUTE_BASE_PATH` para que apunte a una ruta que el software de impresión
  pueda leer (local o recurso de red).
- Los logs rotan diariamente en `logs/` (30 días de retención).
