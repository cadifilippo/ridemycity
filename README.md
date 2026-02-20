# 🚴 RideMyCity

> Traza tus recorridos en bicicleta y descubre tu ciudad, calle por calle.

<p align="left">
  <a href="https://ridemycity-web.vercel.app/">
    <img src="https://img.shields.io/badge/Ver%20app-%E2%96%B6%20ridemycity--web.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="App desplegada en Vercel" />
  </a>
  <br />
  <br />
  <a href="https://docs.google.com/presentation/d/1nQd80GU62wJKY-TL1ZEsXdoh3vJot2t1koIo8i7ZbNg/edit?usp=sharing">
    <img src="https://img.shields.io/badge/Presentaci%C3%B3n-Google%20Slides-FBBC04?style=for-the-badge&logo=google-slides&logoColor=white" alt="Presentación en Google Slides" />
  </a>
  <br />
  <br />
  <a href="docs/ARCHITECTURE.md">
    <img src="https://img.shields.io/badge/Documentaci%C3%B3n-Arquitectura%20%26%20API-4A90E2?style=for-the-badge&logo=gitbook&logoColor=white" alt="Documentación técnica" />
  </a>
  <br />
</p>

---

## Descripción General

RideMyCity es una aplicación donde a quienes les gusta salir a montar en bicicleta pueden buscar su ciudad e ir trazando las carreteras por las que han pasado, y poco a poco ir conociendo todo el vecindario. ([leer la motivación del proyecto](docs/MOTIVATION.md))

Técnicamente es un monorepo gestionado con **pnpm workspaces** que contiene dos aplicaciones: un frontend en **React 19 + Vite** y un backend en **NestJS** que expone una API REST.

## Stack tecnológico

| Capa          | Tecnología                           |
| ------------- | ------------------------------------ |
| Frontend      | React 19 + Vite                      |
| Mapas         | MapLibre GL JS + tiles OpenStreetMap |
| Autenticación | Firebase Auth (Google)               |
| Base de datos | Firestore                            |
| Backend       | NestJS                               |
| Geo           | @turf/turf                           |
| Auth backend  | Firebase Admin SDK                   |
| Tests         | Jest (backend) · Vitest (frontend)   |
| Monorepo      | pnpm workspaces                      |

## Instalación y ejecución

**Requisitos previos:** Node.js 20+, pnpm 9+, y un proyecto de Firebase con Authentication (Google) y Firestore habilitados.

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edita `apps/api/.env`:

| Variable                        | Descripción                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `PORT`                          | Puerto del servidor (por defecto `3000`)                                               |
| `CORS_ORIGIN`                   | Origen permitido (por defecto `http://localhost:5173`)                                 |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service account de Firebase en Base64. Genera con `base64 serviceAccount.json` (macOS) |

Edita `apps/web/.env`:

| Variable                    | Descripción                                           |
| --------------------------- | ----------------------------------------------------- |
| `VITE_API_BASE_URL`         | URL del backend (por defecto `http://localhost:3000`) |
| `VITE_FIREBASE_API_KEY`     | Credenciales del proyecto Firebase (Web SDK)          |
| `VITE_FIREBASE_AUTH_DOMAIN` |                                                       |
| `VITE_FIREBASE_PROJECT_ID`  |                                                       |
| `VITE_FIREBASE_APP_ID`      |                                                       |

```bash
# 3. Arrancar ambas aplicaciones en modo desarrollo
pnpm dev
```

El frontend queda disponible en `http://localhost:5173` y el backend en `http://localhost:3000`.

```bash
# Tests
pnpm --filter api test       # Jest (backend)
pnpm --filter web test       # Vitest (frontend)
```

## Estructuración

```
ridemycity/
├── apps/
│   ├── api/                  # Backend NestJS
│   │   └── src/
│   │       ├── auth/         # Guard, decorador @CurrentUser, Firebase Admin
│   │       ├── geo/          # Geocodificación y límites de ciudad (Nominatim)
│   │       ├── rides/        # CRUD de rutas por usuario
│   │       └── avoid-zones/  # CRUD de zonas a evitar por usuario
│   └── web/                  # Frontend React + Vite
│       └── src/
│           ├── components/   # SearchBar, RideSidebar, DrawingPanel, StatsPanel, SavedList
│           ├── context/      # AuthContext (Firebase Auth)
│           ├── hooks/        # useMapInstance, useSavedShapes, useDrawing, useSelection
│           ├── lib/          # apiClient (axios), mapLayers, geo (haversine)
│           └── pages/        # MapPage, LoginPage
└── packages/
    └── shared/               # Tipos compartidos (pendiente)
```

La API sigue la convención de NestJS: cada funcionalidad tiene su propio módulo con controlador y servicio. El controlador delega inmediatamente al servicio; toda la lógica vive en el servicio. Ver [arquitectura detallada](docs/ARCHITECTURE.md) y [referencia de la API](docs/API.md).

## Funcionalidades

- **Autenticación con Google** — login con Firebase Auth; el backend valida el token en cada petición mediante `AuthGuard`.
- **Búsqueda de ciudad** — busca cualquier ciudad o lugar usando la API de Nominatim (OpenStreetMap). Si hay un único resultado se selecciona automáticamente; si hay varios se muestra una lista. Al seleccionar, el mapa vuela hasta la ciudad y dibuja su límite administrativo.
- **Trazar rutas** — en modo "Cargar Salida" el usuario hace clic sobre el mapa para ir añadiendo puntos. Se muestra la distancia estimada en tiempo real. Al guardar, la ruta se persiste en Firestore asociada al usuario.
- **Zonas a evitar** — en modo "Zona a Evitar" se dibuja un polígono cerrado sobre el mapa. Se persiste igualmente en Firestore.
- **Historial persistente** — al iniciar sesión se cargan automáticamente las rutas y zonas guardadas del usuario y se pintan sobre el mapa.
- **Estadísticas** — el panel lateral muestra el total de kilómetros acumulados y el número de rides completados, calculados en tiempo real a partir de los datos cargados.
- **Selección y borrado** — cada ruta y zona del historial se puede seleccionar (se resalta en el mapa) y eliminar.
- **Localización** — botón para centrar el mapa en la ubicación actual del dispositivo.
- **Easter egg** — si vamos a la url del api, podemos jugar un [minijuego](http://localhost:3000/) tipo runner.
