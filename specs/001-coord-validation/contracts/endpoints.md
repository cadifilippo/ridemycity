# Endpoint Contracts: Coordinate Validation

**Date**: 2026-03-06

## POST /rides

**Auth**: Required (Firebase Auth bearer token)

### Request Body

```json
{
  "coordinates": [[lng, lat], [lng, lat], ...]
}
```

### Validation Rules (new)

| Rule | Condition | Error Message |
|------|-----------|---------------|
| Array check | `coordinates` must be an array | "coordinates must be an array of at least 2 points" |
| Min length | `coordinates.length >= 2` | "coordinates must be an array of at least 2 points" |
| Point structure | Each point is a 2-element array of finite numbers | "Invalid coordinate at index {i}: each point must be [longitude, latitude] with finite numbers" |
| Longitude range | `lng >= -180 && lng <= 180` | "Coordinate at index {i}: longitude must be between -180 and 180" |
| Latitude range | `lat >= -90 && lat <= 90` | "Coordinate at index {i}: latitude must be between -90 and 90" |

### Error Response (400)

```json
{
  "statusCode": 400,
  "message": "Invalid coordinate at index 3: each point must be [longitude, latitude] with finite numbers",
  "error": "Bad Request"
}
```

---

## POST /avoid-zones

**Auth**: Required (Firebase Auth bearer token)

### Request Body

```json
{
  "coordinates": [[lng, lat], [lng, lat], ..., [lng, lat]]
}
```

### Validation Rules (new)

All rules from `POST /rides` plus:

| Rule | Condition | Error Message |
|------|-----------|---------------|
| Min length | `coordinates.length >= 4` | "coordinates must be an array of at least 4 points (closed polygon)" |
| Polygon closure | First point === last point | "Polygon must be closed: first and last coordinates must be identical" |

### Error Response (400)

Same format as rides. Validation runs in order: array check → min length → point structure → range → closure. Stops at first failure.
