# Arquitectura

## Visión general

RideMyCity es un monorepo con dos aplicaciones independientes que se comunican exclusivamente por HTTP. El frontend nunca accede a Firestore directamente — toda operación de datos pasa por el backend, que verifica la identidad del usuario en cada petición.

```
┌─────────────────────────────────┐
│   Browser (React + MapLibre)    │
│                                 │
│  Firebase Auth SDK  ──token──►  │
│  apiClient (axios) ──Bearer──►  │──── HTTPS ────►  NestJS API
│  MapLibre GL JS    ◄──tiles──   │                       │
└─────────────────────────────────┘                       │
         ▲  Nominatim (OSM)                          Firebase Admin
         │  tiles.osm.org                                  │
         └──────────────────────────────────── Firestore ◄─┘
```

---

## Backend (`apps/api`)

### Módulos

```
AppModule
├── ConfigModule          Variables de entorno
├── AuthModule            Guard + decorador @CurrentUser
├── GeoModule             Geocodificación y límites (Nominatim)
├── RidesModule           CRUD de rutas por usuario
└── AvoidZonesModule      CRUD de zonas a evitar por usuario
```

Cada módulo tiene **controller → service** como única capa. El controlador valida la forma del request (mínimo de puntos, presencia de campos) y delega todo al servicio. La lógica de negocio y acceso a Firestore vive exclusivamente en el servicio.

### Autenticación

1. El cliente obtiene un **ID Token** de Firebase Auth al hacer login con Google.
2. Cada request al API lleva el header `Authorization: Bearer <token>`.
3. `AuthGuard` intercepta cada request, extrae el token y llama a `firebase-admin` para verificarlo (`auth.verifyIdToken`).
4. El `uid` verificado se inyecta en el controlador mediante el decorador `@CurrentUser()`.
5. Los servicios reciben el `uid` como argumento y lo usan como clave de ownership en Firestore — ningún usuario puede leer ni borrar datos de otro.

### Firebase Admin

`getAdminAuth()` y `getAdminDb()` usan inicialización lazy con una instancia singleton de la app de Firebase Admin, inicializada a partir de la variable de entorno `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON del service account codificado en Base64).

### Firestore — colecciones

#### `rides`

| Campo         | Tipo      | Descripción                              |
| ------------- | --------- | ---------------------------------------- |
| `uid`         | `string`  | UID del usuario propietario              |
| `coordinates` | `string`  | `JSON.stringify(number[][])` — [lng, lat]|
| `createdAt`   | `Date`    | Timestamp de creación                    |

> Las coordenadas se serializan como JSON string porque Firestore no soporta arrays anidados (`number[][]`).

#### `avoidZones`

Estructura idéntica a `rides`. Las coordenadas forman un polígono cerrado (mínimo 4 puntos, el primero y el último son iguales).

---

## Frontend (`apps/web`)

### Árbol de componentes

```
App
└── AuthContext (Firebase Auth)
    ├── LoginPage          Pantalla de inicio de sesión con Google
    └── MapPage            Vista principal
        └── RideSidebar
            ├── SearchBar         Búsqueda de ciudad (Nominatim vía API)
            ├── DrawingPanel      Controles durante el dibujo activo
            ├── SavedList         Historial de rides y zonas a evitar
            └── StatsPanel        Total km y rides completados
```

### Hooks

| Hook               | Responsabilidad                                                                 |
| ------------------ | ------------------------------------------------------------------------------- |
| `useMapInstance`   | Crea e inicializa el mapa MapLibre, expone `mapRef` y `updateSourceData`        |
| `useSavedShapes`   | Carga rides y zonas desde la API al montar; provee add/delete y sincroniza capas|
| `useDrawing`       | Gestiona el modo de dibujo (ride / avoid), acumulación de puntos y guardado     |
| `useSelection`     | Controla qué ride o zona está seleccionada y resalta la capa correspondiente    |

### Flujo de datos

```
useSavedShapes
   │
   ├── mount → GET /rides + GET /avoid-zones → setSavedRides / setSavedAvoidZones
   │
   ├── addRide(coords) → POST /rides → setSavedRides([...prev, data])
   │                                        │
   │                              useEffect(savedRides) → updateSourceData(RIDES_SOURCE)
   │
   └── deleteRide(id) → DELETE /rides/:id → setSavedRides(prev.filter)
```

### Capas del mapa

Definidas en `lib/mapLayers.ts`. Hay cuatro fuentes GeoJSON y sus capas asociadas:

| Source ID       | Layer               | Uso                          |
| --------------- | ------------------- | ---------------------------- |
| `rides-source`  | `rides-layer`       | Rutas guardadas (líneas)     |
| `avoid-source`  | `avoid-layer`       | Zonas a evitar (polígonos)   |
| `drawing-source`| `drawing-layer`     | Traza en curso               |
| `boundary-source`| `boundary-layer`   | Límite administrativo ciudad |

### apiClient

Instancia de **axios** (`lib/apiClient.ts`) configurada con `baseURL` desde `VITE_API_BASE_URL`. Un interceptor de request adjunta automáticamente el ID Token de Firebase como `Bearer` token en cada petición. El token se obtiene llamando a `auth.currentUser?.getIdToken()` justo antes de enviar.

---

## Convenciones de código

- **TypeScript estricto** en ambas apps. Sin `any` explícito.
- **Backend**: decoradores NestJS habilitados, target ES2023, resolución `nodenext`.
- **Frontend**: `bundler` module resolution, `noUnusedLocals`, `noUnusedParameters`.
- **Tests backend**: Jest, co-ubicados con el fuente (`*.spec.ts`). Nomenclatura 3-partes: `[Clase].[método] when [escenario] should [resultado]`. Patrón AAA.
- **Tests frontend**: Vitest + Testing Library, misma convención de nombres.
- **Componentes web**: cada componente vive en su propia carpeta con `Component.tsx`, `Component.css` y `Component.spec.tsx`.
