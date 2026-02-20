import maplibregl from 'maplibre-gl';
import { type Coordinate, type CityGeometry, type DrawingMode } from '../types';

// ── Source & layer name constants ─────────────────────────────────────────────
export const MASK_SOURCE = 'city-mask';
export const MASK_LAYER = 'city-mask-fill';
export const BOUNDARY_SOURCE = 'city-boundary';
export const BOUNDARY_LINE = 'city-boundary-line';

export const RIDES_SOURCE = 'saved-rides';
export const RIDES_LAYER = 'saved-rides-line';

export const AVOID_SOURCE = 'saved-avoid-zones';
export const AVOID_FILL_LAYER = 'saved-avoid-fill';
export const AVOID_OUTLINE_LAYER = 'saved-avoid-outline';

export const SELECTED_RIDE_SOURCE = 'selected-ride';
export const SELECTED_RIDE_GLOW_LAYER = 'selected-ride-glow';
export const SELECTED_RIDE_LAYER = 'selected-ride-line';

export const SELECTED_AVOID_SOURCE = 'selected-avoid-zone';
export const SELECTED_AVOID_FILL_LAYER = 'selected-avoid-fill';
export const SELECTED_AVOID_OUTLINE_LAYER = 'selected-avoid-outline';

export const DRAFT_LINE_SOURCE = 'draft-line';
export const DRAFT_LINE_LAYER = 'draft-line-layer';
export const DRAFT_POLYGON_SOURCE = 'draft-polygon';
export const DRAFT_POLYGON_FILL_LAYER = 'draft-polygon-fill';
export const DRAFT_POLYGON_OUTLINE_LAYER = 'draft-polygon-outline';

// ── Internal helpers ──────────────────────────────────────────────────────────
const WORLD_RING: [number, number][] = [
  [-180, -90],
  [180, -90],
  [180, 90],
  [-180, 90],
  [-180, -90],
];

type LineFeature = GeoJSON.Feature<GeoJSON.LineString>;
type PolygonFeature = GeoJSON.Feature<GeoJSON.Polygon>;
export type FeatureCollection<T extends GeoJSON.Geometry> = GeoJSON.FeatureCollection<T>;

// ── GeoJSON feature factories ─────────────────────────────────────────────────
export function createLineFeature(coordinates: Coordinate[]): LineFeature {
  return { type: 'Feature', geometry: { type: 'LineString', coordinates }, properties: {} };
}

export function createPolygonFeature(coordinates: Coordinate[]): PolygonFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coordinates] },
    properties: {},
  };
}

export function createFeatureCollection<T extends GeoJSON.Geometry>(
  features: Array<GeoJSON.Feature<T>>,
): FeatureCollection<T> {
  return { type: 'FeatureCollection', features };
}

function createInvertedMask(geojson: CityGeometry) {
  const holes =
    geojson.type === 'Polygon'
      ? [geojson.coordinates[0]]
      : geojson.coordinates.map(polygon => polygon[0]);

  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [WORLD_RING, ...holes] },
    properties: {},
  };
}

// ── Boundary layer helpers ────────────────────────────────────────────────────
export function clearBoundary(map: maplibregl.Map) {
  if (map.getLayer(MASK_LAYER)) map.removeLayer(MASK_LAYER);
  if (map.getLayer(BOUNDARY_LINE)) map.removeLayer(BOUNDARY_LINE);
  if (map.getSource(MASK_SOURCE)) map.removeSource(MASK_SOURCE);
  if (map.getSource(BOUNDARY_SOURCE)) map.removeSource(BOUNDARY_SOURCE);
}

export function drawBoundary(map: maplibregl.Map, geojson: CityGeometry) {
  clearBoundary(map);

  map.addSource(MASK_SOURCE, {
    type: 'geojson',
    data: createInvertedMask(geojson) as never,
  });
  map.addLayer({
    id: MASK_LAYER,
    type: 'fill',
    source: MASK_SOURCE,
    paint: { 'fill-color': '#64748b', 'fill-opacity': 0.45 },
  });

  map.addSource(BOUNDARY_SOURCE, {
    type: 'geojson',
    data: { type: 'Feature', geometry: geojson, properties: {} } as never,
  });
  map.addLayer({
    id: BOUNDARY_LINE,
    type: 'line',
    source: BOUNDARY_SOURCE,
    paint: { 'line-color': '#2563eb', 'line-width': 2 },
  });
}

// ── Drawing marker helper ─────────────────────────────────────────────────────
export function createDraftPointElement(mode: Exclude<DrawingMode, null>): HTMLDivElement {
  const element = document.createElement('div');
  element.style.width = '8px';
  element.style.height = '8px';
  element.style.borderRadius = '9999px';
  element.style.backgroundColor = mode === 'ride' ? '#22c55e' : '#ef4444';
  element.style.border = '1.5px solid #ffffff';
  element.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.08)';
  return element;
}
