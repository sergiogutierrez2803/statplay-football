# StatPlay Football

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Railway](https://img.shields.io/badge/Backend-Railway-blueviolet?style=flat-square&logo=railway)](https://railway.app)
[![MySQL](https://img.shields.io/badge/Database-MySQL-blue?style=flat-square&logo=mysql)](https://mysql.com)

**StatPlay Football** es una plataforma de análisis predictivo de fútbol de alto rendimiento que combina datos en tiempo real de múltiples APIs para ofrecer predicciones precisas de las principales ligas europeas y el Mundial 2026.

## 🚀 Características Principales

- **Análisis Híbrido**: Combina Football-Data.org (fixtures) con API-Football (estadísticas).
- **Motor Predictivo V3**: Algoritmos basados en Distribución de Poisson y modelo Dixon-Coles.
- **Módulo Mundial 2026**: Seguimiento completo de grupos y partidos del torneo.
- **PWA Ready**: Instalable en dispositivos móviles con soporte offline básico.
- **Multi-idioma**: Soporte completo para Español e Inglés.

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Backend**: Node.js, Express.
- **Base de Datos**: MySQL.
- **Infraestructura**: Vercel (Frontend) + Railway (Backend).

## 📦 Estructura del Proyecto

```bash
├── css/                # Estilos (Layout, Componentes, Animaciones)
├── js/                 # Lógica Frontend (API, Motor, UI, I18n)
├── server/             # Backend Node.js
│   ├── index.js        # Servidor Express
│   ├── predictor.js    # Motor de predicción (Matemáticas)
│   └── sync.js         # Sincronización de APIs
├── index.html          # Punto de entrada principal
└── vercel.json         # Configuración de despliegue y seguridad
```

## ⚙️ Instalación Local

1.  **Clonar el repositorio**:
    ```bash
    git clone https://github.com/tu-usuario/statplay-football.git
    cd statplay-football
    ```

2.  **Configurar el Backend**:
    ```bash
    cd server
    npm install
    cp .env.example .env
    # Rellenar .env con tus credenciales de API y MySQL
    npm start
    ```

3.  **Configurar el Frontend**:
    - Abre `index.html` con un servidor estático (ej. Live Server de VS Code).
    - Asegúrate de que `window.__BACKEND_URL__` apunte a `http://localhost:3000/api`.

## 🌐 Despliegue

### Backend (Railway)
- Conecta el repo y selecciona la carpeta `/server` como root.
- Railway detectará automáticamente el `Procfile` y `package.json`.

### Frontend (Vercel)
- Conecta el repo y usa la raíz `/` como proyecto.
- Configura las variables si es necesario en `set-backend-url.js`.

---
*Desarrollado para amantes de los datos y el fútbol.*
