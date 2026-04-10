# StatPlay Football — Guía de Deploy en Producción

> Guía completa paso a paso para lanzar StatPlay en la web.
> **Frontend → Vercel** | **Backend → Railway** | **Base de datos → Railway MySQL**

---

## Requisitos previos

Antes de empezar necesitas tener:

- Cuenta en [GitHub](https://github.com) con el repositorio del proyecto
- Cuenta en [Vercel](https://vercel.com) (gratis)
- Cuenta en [Railway](https://railway.app) (gratis con límites)
- API Key de [Football-Data.org](https://www.football-data.org) (plan gratuito)
- API Key de [API-Football](https://www.api-football.com) (plan gratuito)
- Node.js >= 18 instalado localmente

---

## Estructura del proyecto

```
/                        ← Frontend (se despliega en Vercel)
├── index.html
├── css/
├── js/
├── assets/
├── vercel.json
└── server/              ← Backend (se despliega en Railway)
    ├── index.js
    ├── package.json
    ├── .env.example
    ├── schema.sql
    ├── seed.js
    ├── migrate.js
    └── Procfile
```

---

## PASO 1 — Subir el proyecto a GitHub

Si aún no tienes el repositorio en GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/statplay.git
git push -u origin main
```

> Asegúrate de que `.env` está en `.gitignore` y **nunca** se sube al repositorio.

---

## PASO 2 — Desplegar el Backend en Railway

### 2.1 Crear el proyecto en Railway

1. Ve a [railway.app](https://railway.app) e inicia sesión
2. Clic en **New Project**
3. Selecciona **Deploy from GitHub repo**
4. Conecta tu cuenta de GitHub y selecciona el repositorio de StatPlay
5. Railway detectará el proyecto automáticamente

### 2.2 Configurar el directorio raíz del backend

En Railway, dentro del servicio creado:

1. Ve a **Settings → Source**
2. En **Root Directory** escribe: `server`
3. En **Start Command** escribe: `node index.js`

### 2.3 Añadir MySQL en Railway

1. En tu proyecto Railway, clic en **+ New**
2. Selecciona **Database → MySQL**
3. Railway creará la base de datos y generará las variables de conexión automáticamente

### 2.4 Configurar variables de entorno en Railway

En el servicio del backend, ve a **Variables** y añade:

```
PORT=3000
NODE_ENV=production
DB_HOST=<copiado automáticamente por Railway desde MySQL>
DB_USER=<copiado automáticamente por Railway desde MySQL>
DB_PASS=<copiado automáticamente por Railway desde MySQL>
DB_NAME=statplay_db
DB_SSL=true
FOOTBALL_API_KEY=tu_key_de_api_football
FOOTBALL_DATA_KEY=tu_key_de_football_data
FRONTEND_URL=https://tu-app.vercel.app
ADMIN_KEY=<generar con el comando de abajo>
```

Para generar `ADMIN_KEY`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **Nota**: Railway conecta MySQL automáticamente. Las variables `DB_HOST`, `DB_USER`, `DB_PASS` las puedes copiar desde el servicio MySQL en Railway → **Connect**.

### 2.5 Inicializar la base de datos

Una vez que Railway haya desplegado el backend, abre la terminal de Railway o conéctate localmente con las credenciales de Railway:

**Opción A — Desde Railway Shell** (en el servicio backend → Shell):
```bash
node migrate.js
node seed.js
```

**Opción B — Desde tu máquina local** (con las credenciales de Railway en tu `.env`):
```bash
cd server
cp .env.example .env
# Edita .env con las credenciales de Railway
node migrate.js
node seed.js
```

### 2.6 Sincronizar datos reales

Después del seed, sincroniza los datos reales de las APIs:

```bash
# Desde Railway Shell o localmente:
node -e "require('dotenv').config(); const {syncAllData}=require('./sync'); syncAllData().then(r=>{ console.log(JSON.stringify(r,null,2)); process.exit(0); });"
```

O desde el navegador (una vez el backend esté desplegado):
```
GET https://tu-backend.railway.app/api/admin/sync
Header: x-admin-key: TU_ADMIN_KEY
```

### 2.7 Verificar que el backend funciona

Abre en el navegador:
```
https://tu-backend.railway.app/health
```

Debes ver:
```json
{ "status": "ok", "timestamp": "...", "env": "production" }
```

---

## PASO 3 — Desplegar el Frontend en Vercel

### 3.1 Crear el proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Clic en **Add New → Project**
3. Importa el repositorio de GitHub
4. En la configuración del proyecto:
   - **Framework Preset**: Other (sitio estático)
   - **Root Directory**: `/` (raíz del proyecto, no `server/`)
   - **Build Command**: dejar vacío
   - **Output Directory**: dejar vacío

### 3.2 Configurar la URL del backend en Vercel

> ✅ **Este paso es automático** — ya no necesitas editar `index.html` manualmente.

En el dashboard de Vercel, ve a tu proyecto → **Settings → Environment Variables** y añade:

```
BACKEND_URL = https://tu-backend.railway.app/api
```

Al hacer el siguiente deploy, Vercel ejecutará automáticamente `node set-backend-url.js`
(configurado en `vercel.json → buildCommand`) que inyectará la URL real en `index.html`.

> **Importante**: La variable debe llamarse exactamente `BACKEND_URL` (sin prefijo VITE_ ni NEXT_).

### 3.3 Desplegar

Vercel desplegará automáticamente al hacer push. También puedes hacer clic en **Deploy** manualmente.

### 3.4 Actualizar FRONTEND_URL en Railway

Una vez Vercel te dé la URL del frontend (ej: `https://statplay.vercel.app`), actualiza la variable en Railway:

```
FRONTEND_URL=https://statplay.vercel.app
```

Esto es necesario para que el CORS del backend permita las peticiones del frontend.

---

## PASO 4 — Verificación final

### Checklist de verificación

- [ ] `https://tu-backend.railway.app/health` devuelve `{ "status": "ok" }`
- [ ] `https://tu-backend.railway.app/api/leagues` devuelve las 4 ligas
- [ ] `https://tu-app.vercel.app` carga la aplicación
- [ ] El selector de ligas muestra PL, BL, La Liga, Serie A y World Cup
- [ ] Las tablas de posiciones cargan datos reales
- [ ] Los próximos partidos se muestran
- [ ] El análisis de un partido funciona
- [ ] Los grupos del Mundial se muestran correctamente

### Verificar la base de datos

```
GET https://tu-backend.railway.app/api/admin/status
Header: x-admin-key: TU_ADMIN_KEY
```

Debes ver algo como:
```json
{
  "db": {
    "equipos": 78,
    "stats": 78,
    "partidos": 120,
    "predicciones": 0,
    "h2h_cache": 0
  }
}
```

---

## PASO 5 — Desarrollo local

Para correr el proyecto localmente:

### Terminal 1 — Backend
```bash
cd server
npm install
cp .env.example .env
# Edita .env con tus credenciales locales
node migrate.js
node seed.js
npm start
# Backend corriendo en http://localhost:3000
```

### Terminal 2 — Frontend
```bash
# Desde la raíz del proyecto
node frontend-server.js
# Frontend corriendo en http://localhost:8080
```

O simplemente haz doble clic en `start.bat` (Windows).

---

## Variables de entorno — Referencia completa

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno | `production` |
| `DB_HOST` | Host MySQL | `containers-us-west-1.railway.app` |
| `DB_USER` | Usuario MySQL | `root` |
| `DB_PASS` | Contraseña MySQL | `abc123...` |
| `DB_NAME` | Nombre de la base de datos | `statplay_db` |
| `DB_SSL` | Activar SSL para Railway | `true` |
| `FOOTBALL_API_KEY` | Key de API-Football | `abc123...` |
| `FOOTBALL_DATA_KEY` | Key de Football-Data.org | `abc123...` |
| `FRONTEND_URL` | URL del frontend en Vercel | `https://statplay.vercel.app` |
| `ADMIN_KEY` | Clave para endpoints admin | `abc123...` (32 bytes hex) |

---

## Comandos útiles

```bash
# Ejecutar migraciones de DB
cd server && node migrate.js

# Seed inicial (estructura base)
cd server && node seed.js

# Sincronizar datos reales de APIs
cd server && npm run sync

# Limpiar datos antiguos manualmente
cd server && node cleanup.js

# Generar ADMIN_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Endpoints admin (requieren header x-admin-key)

```
GET /api/admin/sync        → Sincronizar datos de APIs externas
GET /api/admin/sync-logos  → Actualizar logos de ligas
GET /api/admin/status      → Estado del sistema y DB
```

Ejemplo con curl:
```bash
curl -H "x-admin-key: TU_ADMIN_KEY" https://tu-backend.railway.app/api/admin/sync
```

---

## Solución de problemas comunes

### El frontend no conecta con el backend
- Verifica que `window.__BACKEND_URL__` en `index.html` apunta a la URL correcta de Railway
- Verifica que `FRONTEND_URL` en Railway coincide exactamente con la URL de Vercel
- Revisa los logs de Railway para errores de CORS

### La base de datos no conecta
- Verifica que `DB_SSL=true` está configurado en Railway
- Copia las credenciales directamente desde el servicio MySQL en Railway → Connect
- Asegúrate de que `DB_NAME=statplay_db` (la DB se crea con `schema.sql`)

### Los datos no aparecen
- Ejecuta `node migrate.js` para crear las tablas
- Ejecuta `node seed.js` para datos base
- Llama a `/api/admin/sync` para datos reales de APIs

### Error 401 en endpoints admin
- Asegúrate de enviar el header `x-admin-key: TU_ADMIN_KEY`
- Verifica que `ADMIN_KEY` está configurada en Railway

### Railway no detecta el directorio correcto
- En Railway → Settings → Source → Root Directory: `server`
- Start Command: `node index.js`

---

## Arquitectura de producción

```
Usuario
  │
  ▼
Vercel (Frontend estático)
  │  index.html + css/ + js/ + assets/
  │
  │  fetch() a /api/*
  ▼
Railway (Backend Node.js)
  │  Express + CORS + Rate Limiting
  │
  ├── Football-Data.org API  (standings, fixtures)
  ├── API-Football API       (estadísticas históricas, H2H)
  │
  ▼
Railway MySQL
  │  equipos, estadisticas, partidos
  │  predicciones, h2h_cache, recent_form_cache
```

---

## Actualizaciones automáticas

El backend tiene un cron configurado que:
- **03:00 AM diario** → Sincroniza standings y fixtures de todas las ligas
- **Domingo 04:00 AM** → Limpia predicciones antiguas y cache expirado
- **Cada 12 horas** → Health check de la base de datos

No necesitas hacer nada manual para mantener los datos actualizados.

---

*StatPlay Football v1.1.0 — Premier League · Bundesliga · La Liga · Serie A · FIFA World Cup 2026*
