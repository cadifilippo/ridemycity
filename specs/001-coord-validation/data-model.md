# Data Model: Coordinate Validation Hardening

**Date**: 2026-03-06

## Entities

### CoordinatePoint

A single geographic position.

| Field | Type | Constraints |
|-------|------|-------------|
| longitude | number | Finite, [-180, 180] |
| latitude | number | Finite, [-90, 90] |

**Wire format**: `[longitude, latitude]` (two-element number array, GeoJSON convention).

**Validation rules**:
- Must be an array of exactly 2 elements
- Both elements must be finite numbers (not NaN, not Infinity, not null, not string)
- Element 0 (longitude) must be in range [-180, 180]
- Element 1 (latitude) must be in range [-90, 90]

### RideCoordinates

An ordered sequence of coordinate points representing a polyline (route).

| Field | Type | Constraints |
|-------|------|-------------|
| coordinates | CoordinatePoint[] | Minimum 2 points, all points valid |

### AvoidZoneCoordinates

An ordered sequence of coordinate points representing a closed polygon.

| Field | Type | Constraints |
|-------|------|-------------|
| coordinates | CoordinatePoint[] | Minimum 4 points, all points valid, first === last |

**Closure rule**: `coordinates[0]` must equal `coordinates[coordinates.length - 1]` by value (both longitude and latitude match exactly).

## No Storage Changes

This feature validates input before persistence. The Firestore collections (`rides`, `avoidZones`) remain unchanged. Previously persisted data is not affected (no migration needed).
