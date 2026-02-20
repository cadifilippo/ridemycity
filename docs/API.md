# API Reference

Base URL (desarrollo): `http://localhost:3000`

Todos los endpoints marcados con 🔒 requieren el header:
```
Authorization: Bearer <Firebase ID Token>
```

---

## Healthcheck

### `GET /healthcheck`

Verifica que el servidor está activo. No requiere autenticación.

**Respuesta `200`**
```json
{
  "status": "ok",
  "uptime": 142.38,
  "timestamp": "2025-06-01T10:00:00.000Z"
}
```

---

## Geo

### `GET /geo/geocode?q=<query>` 🔒

Busca ciudades y lugares usando Nominatim (OpenStreetMap). Devuelve hasta 5 resultados.

**Query params**

| Param | Tipo     | Requerido | Descripción          |
| ----- | -------- | --------- | -------------------- |
| `q`   | `string` | Sí        | Nombre del lugar     |

**Respuesta `200`**
```json
[
  {
    "place_id": 282071899,
    "display_name": "Ciudad de México, México",
    "lat": "19.4326296",
    "lon": "-99.1331785",
    "type": "administrative",
    "importance": 0.85
  }
]
```

**Errores**
- `400` — parámetro `q` ausente o vacío
- `500` — Nominatim no disponible

---

### `GET /geo/boundary?q=<query>` 🔒

Devuelve el límite administrativo (GeoJSON) de una ciudad o región.

**Query params**

| Param | Tipo     | Requerido | Descripción       |
| ----- | -------- | --------- | ----------------- |
| `q`   | `string` | Sí        | Nombre del lugar  |

**Respuesta `200`**
```json
{
  "display_name": "Ciudad de México, México",
  "geojson": {
    "type": "Polygon",
    "coordinates": [[[...]]]
  },
  "boundingbox": ["19.04", "19.59", "-99.36", "-98.94"]
}
```

**Errores**
- `400` — parámetro `q` ausente o vacío
- `404` — la búsqueda no devuelve un límite poligonal (puede ser un punto)
- `500` — Nominatim no disponible

---

## Rides

### `GET /rides` 🔒

Devuelve todas las rutas guardadas del usuario autenticado.

**Respuesta `200`**
```json
[
  {
    "id": "Xk9f2abc",
    "coordinates": [[-99.1332, 19.4326], [-99.14, 19.438]]
  }
]
```

---

### `POST /rides` 🔒

Guarda una nueva ruta.

**Body**
```json
{
  "coordinates": [[-99.1332, 19.4326], [-99.14, 19.438], [-99.15, 19.44]]
}
```

| Campo         | Tipo         | Restricción             |
| ------------- | ------------ | ----------------------- |
| `coordinates` | `number[][]` | Mínimo 2 puntos `[lng, lat]` |

**Respuesta `201`**
```json
{
  "id": "Xk9f2abc",
  "coordinates": [[-99.1332, 19.4326], [-99.14, 19.438], [-99.15, 19.44]]
}
```

**Errores**
- `400` — `coordinates` ausente o con menos de 2 puntos

---

### `DELETE /rides/:id` 🔒

Elimina una ruta del usuario autenticado.

**Params**

| Param | Tipo     | Descripción   |
| ----- | -------- | ------------- |
| `id`  | `string` | ID del ride   |

**Respuesta `200`** — vacío

**Errores**
- `403` — el ride existe pero pertenece a otro usuario
- `404` — el ride no existe

---

## Avoid Zones

### `GET /avoid-zones` 🔒

Devuelve todas las zonas a evitar del usuario autenticado.

**Respuesta `200`**
```json
[
  {
    "id": "aZ1b2c3d",
    "coordinates": [
      [-99.15, 19.44],
      [-99.13, 19.44],
      [-99.13, 19.45],
      [-99.15, 19.45],
      [-99.15, 19.44]
    ]
  }
]
```

---

### `POST /avoid-zones` 🔒

Guarda una nueva zona a evitar (polígono cerrado).

**Body**
```json
{
  "coordinates": [
    [-99.15, 19.44],
    [-99.13, 19.44],
    [-99.13, 19.45],
    [-99.15, 19.45],
    [-99.15, 19.44]
  ]
}
```

| Campo         | Tipo         | Restricción                        |
| ------------- | ------------ | ---------------------------------- |
| `coordinates` | `number[][]` | Mínimo 4 puntos `[lng, lat]` (polígono cerrado) |

**Respuesta `201`**
```json
{
  "id": "aZ1b2c3d",
  "coordinates": [...]
}
```

**Errores**
- `400` — `coordinates` ausente o con menos de 4 puntos

---

### `DELETE /avoid-zones/:id` 🔒

Elimina una zona a evitar del usuario autenticado.

**Params**

| Param | Tipo     | Descripción          |
| ----- | -------- | -------------------- |
| `id`  | `string` | ID de la avoid zone  |

**Respuesta `200`** — vacío

**Errores**
- `403` — la zona existe pero pertenece a otro usuario
- `404` — la zona no existe
