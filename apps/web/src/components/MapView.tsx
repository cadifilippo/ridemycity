import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapView.css';
import { type GeoResult } from './SearchBar';
import RideSidebar from './RideSidebar';

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

const EMPTY_STATS = { totalKm: 0, cityExplored: 0, totalRides: 0 };

const API_BASE = 'http://localhost:3000';
const MASK_SOURCE = 'city-mask';
const MASK_LAYER = 'city-mask-fill';
const BOUNDARY_SOURCE = 'city-boundary';
const BOUNDARY_LINE = 'city-boundary-line';
const RIDES_SOURCE = 'saved-rides';
const RIDES_LAYER = 'saved-rides-line';
const AVOID_SOURCE = 'saved-avoid-zones';
const AVOID_FILL_LAYER = 'saved-avoid-fill';
const AVOID_OUTLINE_LAYER = 'saved-avoid-outline';
const DRAFT_LINE_SOURCE = 'draft-line';
const DRAFT_LINE_LAYER = 'draft-line-layer';
const DRAFT_POLYGON_SOURCE = 'draft-polygon';
const DRAFT_POLYGON_FILL_LAYER = 'draft-polygon-fill';
const DRAFT_POLYGON_OUTLINE_LAYER = 'draft-polygon-outline';

type Coordinate = [number, number];
type DrawingMode = 'ride' | 'avoid' | null;
type LineFeature = GeoJSON.Feature<GeoJSON.LineString>;
type PolygonFeature = GeoJSON.Feature<GeoJSON.Polygon>;
type FeatureCollection<T extends GeoJSON.Geometry> = GeoJSON.FeatureCollection<T>;
type StoredRide = { id: string; coordinates: Coordinate[] };
type StoredAvoidZone = { id: string; coordinates: Coordinate[] };

// Full-world bounding ring used as the outer polygon of the inverted mask
const WORLD_RING: [number, number][] = [
  [-180, -90],
  [180, -90],
  [180, 90],
  [-180, 90],
  [-180, -90],
];

type PolygonGeometry = { type: 'Polygon'; coordinates: number[][][] };
type MultiPolygonGeometry = { type: 'MultiPolygon'; coordinates: number[][][][] };
type CityGeometry = PolygonGeometry | MultiPolygonGeometry;

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

function clearBoundary(map: maplibregl.Map) {
  if (map.getLayer(MASK_LAYER)) map.removeLayer(MASK_LAYER);
  if (map.getLayer(BOUNDARY_LINE)) map.removeLayer(BOUNDARY_LINE);
  if (map.getSource(MASK_SOURCE)) map.removeSource(MASK_SOURCE);
  if (map.getSource(BOUNDARY_SOURCE)) map.removeSource(BOUNDARY_SOURCE);
}

function drawBoundary(map: maplibregl.Map, geojson: CityGeometry) {
  clearBoundary(map);

  // World minus city → grey overlay outside
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

  // City border
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

function createLineFeature(coordinates: Coordinate[]): LineFeature {
  return {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates },
    properties: {},
  };
}

function createPolygonFeature(coordinates: Coordinate[]): PolygonFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coordinates] },
    properties: {},
  };
}

function createFeatureCollection<T extends GeoJSON.Geometry>(
  features: Array<GeoJSON.Feature<T>>,
): FeatureCollection<T> {
  return { type: 'FeatureCollection', features };
}

function ensureClosedRing(coordinates: Coordinate[]): Coordinate[] {
  if (coordinates.length === 0) return coordinates;
  const [firstLng, firstLat] = coordinates[0];
  const [lastLng, lastLat] = coordinates[coordinates.length - 1];
  if (firstLng === lastLng && firstLat === lastLat) return coordinates;
  return [...coordinates, coordinates[0]];
}

function calculateDistanceKm(coordinates: Coordinate[]): number {
  let totalKm = 0;

  for (let i = 1; i < coordinates.length; i += 1) {
    const [lng1, lat1] = coordinates[i - 1];
    const [lng2, lat2] = coordinates[i];
    const earthRadiusKm = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;

    totalKm += earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  return totalKm;
}

function createDraftPointElement(mode: Exclude<DrawingMode, null>): HTMLDivElement {
  const element = document.createElement('div');
  element.style.width = '8px';
  element.style.height = '8px';
  element.style.borderRadius = '9999px';
  element.style.backgroundColor = mode === 'ride' ? '#22c55e' : '#ef4444';
  element.style.border = '1.5px solid #ffffff';
  element.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, 0.08)';
  return element;
}

const INITIAL_RIDES: StoredRide[] = [
  {
    id: 'ride-1',
    coordinates: [
      [-99.1332, 19.4326],
      [-99.138, 19.435],
      [-99.135, 19.438],
      [-99.13, 19.44],
    ],
  },
  {
    id: 'ride-2',
    coordinates: [
      [-99.14, 19.428],
      [-99.145, 19.43],
      [-99.148, 19.434],
    ],
  },
];

const INITIAL_AVOID_ZONES: StoredAvoidZone[] = [
  {
    id: 'avoid-1',
    coordinates: [
      [-99.15, 19.425],
      [-99.15, 19.427],
      [-99.147, 19.427],
      [-99.147, 19.425],
      [-99.15, 19.425],
    ],
  },
];

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const drawingPointsRef = useRef<Coordinate[]>([]);
  const cursorPointRef = useRef<Coordinate | null>(null);
  const draftMarkersRef = useRef<maplibregl.Marker[]>([]);
  const shapeCounterRef = useRef(2);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null);
  const [estimatedKm, setEstimatedKm] = useState(0);
  const [savedRides, setSavedRides] = useState<StoredRide[]>(INITIAL_RIDES);
  const [savedAvoidZones, setSavedAvoidZones] = useState<StoredAvoidZone[]>(INITIAL_AVOID_ZONES);
  const createShapeId = useCallback((prefix: 'ride' | 'avoid') => {
    shapeCounterRef.current += 1;
    return `${prefix}-${shapeCounterRef.current}`;
  }, []);

  const updateSourceData = useCallback(
    <T extends GeoJSON.Geometry>(sourceId: string, data: FeatureCollection<T>) => {
      const map = mapRef.current;
      if (!map) return;
      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
      source?.setData(data as GeoJSON.GeoJSON);
    },
    [],
  );

  const updateDraftLayers = useCallback(() => {
    const points = drawingPointsRef.current;
    const cursor = cursorPointRef.current;
    const isRideMode = drawingMode === 'ride';
    const isAvoidMode = drawingMode === 'avoid';

    const lineCoordinates = isRideMode
      ? cursor && points.length > 0
        ? [...points, cursor]
        : points
      : [];
    const lineFeatures = lineCoordinates.length > 1 ? [createLineFeature(lineCoordinates)] : [];

    const polygonCoordinates = isAvoidMode && points.length > 2 ? ensureClosedRing(points) : [];
    const polygonFeatures =
      polygonCoordinates.length > 3 ? [createPolygonFeature(polygonCoordinates)] : [];

    updateSourceData(DRAFT_LINE_SOURCE, createFeatureCollection(lineFeatures));
    updateSourceData(DRAFT_POLYGON_SOURCE, createFeatureCollection(polygonFeatures));
  }, [drawingMode, updateSourceData]);

  const clearDraft = useCallback(() => {
    drawingPointsRef.current = [];
    cursorPointRef.current = null;
    draftMarkersRef.current.forEach(marker => marker.remove());
    draftMarkersRef.current = [];
    setEstimatedKm(0);
    updateDraftLayers();
  }, [updateDraftLayers]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [0, 20],
      zoom: 2,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      map.addSource(RIDES_SOURCE, {
        type: 'geojson',
        data: createFeatureCollection(INITIAL_RIDES.map(ride => createLineFeature(ride.coordinates))) as GeoJSON.GeoJSON,
      });
      map.addLayer({
        id: RIDES_LAYER,
        type: 'line',
        source: RIDES_SOURCE,
        paint: {
          'line-color': '#60a5fa',
          'line-width': 4,
          'line-opacity': 0.72,
        },
      });

      map.addSource(AVOID_SOURCE, {
        type: 'geojson',
        data: createFeatureCollection(
          INITIAL_AVOID_ZONES.map(zone => createPolygonFeature(zone.coordinates)),
        ) as GeoJSON.GeoJSON,
      });
      map.addLayer({
        id: AVOID_FILL_LAYER,
        type: 'fill',
        source: AVOID_SOURCE,
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.18,
        },
      });
      map.addLayer({
        id: AVOID_OUTLINE_LAYER,
        type: 'line',
        source: AVOID_SOURCE,
        paint: {
          'line-color': '#dc2626',
          'line-width': 2,
          'line-dasharray': [2, 2],
        },
      });

      map.addSource(DRAFT_LINE_SOURCE, {
        type: 'geojson',
        data: createFeatureCollection<GeoJSON.LineString>([]) as GeoJSON.GeoJSON,
      });
      map.addLayer({
        id: DRAFT_LINE_LAYER,
        type: 'line',
        source: DRAFT_LINE_SOURCE,
        paint: {
          'line-color': '#22c55e',
          'line-width': 4,
          'line-opacity': 0.95,
        },
      });

      map.addSource(DRAFT_POLYGON_SOURCE, {
        type: 'geojson',
        data: createFeatureCollection<GeoJSON.Polygon>([]) as GeoJSON.GeoJSON,
      });
      map.addLayer({
        id: DRAFT_POLYGON_FILL_LAYER,
        type: 'fill',
        source: DRAFT_POLYGON_SOURCE,
        paint: {
          'fill-color': '#ef4444',
          'fill-opacity': 0.22,
        },
      });
      map.addLayer({
        id: DRAFT_POLYGON_OUTLINE_LAYER,
        type: 'line',
        source: DRAFT_POLYGON_SOURCE,
        paint: {
          'line-color': '#ef4444',
          'line-width': 2,
        },
      });

      navigator.geolocation.getCurrentPosition(({ coords }) => {
        map.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom: 14,
          speed: 1.4,
        });
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    updateSourceData(
      RIDES_SOURCE,
      createFeatureCollection(savedRides.map(ride => createLineFeature(ride.coordinates))),
    );
  }, [savedRides, updateSourceData]);

  useEffect(() => {
    updateSourceData(
      AVOID_SOURCE,
      createFeatureCollection(savedAvoidZones.map(zone => createPolygonFeature(zone.coordinates))),
    );
  }, [savedAvoidZones, updateSourceData]);

  async function handleResultSelect(result: GeoResult) {
    if (mapRef.current) clearBoundary(mapRef.current);

    mapRef.current?.flyTo({
      center: [parseFloat(result.lon), parseFloat(result.lat)],
      zoom: 14,
      speed: 1.4,
    });

    const res = await fetch(
      `${API_BASE}/geo/boundary?q=${encodeURIComponent(result.display_name)}`,
    );
    if (res.ok) {
      const { geojson } = (await res.json()) as { geojson: CityGeometry };
      if (mapRef.current) drawBoundary(mapRef.current, geojson);
    }
  }

  function handleLocate() {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      mapRef.current?.flyTo({
        center: [coords.longitude, coords.latitude],
        zoom: 14,
        speed: 1.4,
      });
    });
  }

  function handleUndo() {
    if (!drawingMode || drawingPointsRef.current.length === 0) return;

    drawingPointsRef.current = drawingPointsRef.current.slice(0, -1);
    const lastMarker = draftMarkersRef.current.pop();
    lastMarker?.remove();
    if (drawingMode === 'ride') {
      setEstimatedKm(calculateDistanceKm(drawingPointsRef.current));
    }
    updateDraftLayers();
  }

  function handleStopDrawing() {
    clearDraft();
    setDrawingMode(null);
  }

  function handleSave() {
    const pointsToSave = [...drawingPointsRef.current];

    if (drawingMode === 'ride' && pointsToSave.length > 1) {
      setSavedRides(prev => {
        const nextRides = [
          ...prev,
          { id: createShapeId('ride'), coordinates: pointsToSave },
        ];
        updateSourceData(
          RIDES_SOURCE,
          createFeatureCollection(nextRides.map(ride => createLineFeature(ride.coordinates))),
        );
        return nextRides;
      });
    }

    if (drawingMode === 'avoid' && pointsToSave.length > 2) {
      setSavedAvoidZones(prev => {
        const nextZones = [
          ...prev,
          {
            id: createShapeId('avoid'),
            coordinates: ensureClosedRing(pointsToSave),
          },
        ];
        updateSourceData(
          AVOID_SOURCE,
          createFeatureCollection(nextZones.map(zone => createPolygonFeature(zone.coordinates))),
        );
        return nextZones;
      });
    }

    clearDraft();
    setDrawingMode(null);
  }

  function handleDeleteRide(id: string) {
    setSavedRides(prev => prev.filter(ride => ride.id !== id));
  }

  function handleDeleteAvoidZone(id: string) {
    setSavedAvoidZones(prev => prev.filter(zone => zone.id !== id));
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (event: maplibregl.MapMouseEvent) => {
      if (!drawingMode) return;

      const point: Coordinate = [event.lngLat.lng, event.lngLat.lat];
      drawingPointsRef.current = [...drawingPointsRef.current, point];
      const marker = new maplibregl.Marker({
        element: createDraftPointElement(drawingMode),
        anchor: 'center',
      });
      marker.setLngLat(point).addTo(map);
      draftMarkersRef.current.push(marker);

      if (drawingMode === 'ride') {
        setEstimatedKm(calculateDistanceKm(drawingPointsRef.current));
      }

      updateDraftLayers();
    };

    const handleMouseMove = (event: maplibregl.MapMouseEvent) => {
      if (drawingMode !== 'ride' || drawingPointsRef.current.length === 0) return;
      cursorPointRef.current = [event.lngLat.lng, event.lngLat.lat];
      updateDraftLayers();
    };

    const clearCursor = () => {
      if (cursorPointRef.current) {
        cursorPointRef.current = null;
        updateDraftLayers();
      }
    };

    map.on('click', handleMapClick);
    map.on('mousemove', handleMouseMove);
    map.on('mouseout', clearCursor);

    return () => {
      map.off('click', handleMapClick);
      map.off('mousemove', handleMouseMove);
      map.off('mouseout', clearCursor);
    };
  }, [drawingMode, updateDraftLayers]);

  useEffect(() => {
    clearDraft();
  }, [drawingMode, clearDraft]);

  return (
    <div className="map-wrapper">
      <div ref={containerRef} className="map-container" />
      <RideSidebar
        drawingMode={drawingMode}
        estimatedKm={estimatedKm}
        stats={EMPTY_STATS}
        savedRides={savedRides.map((ride, index) => ({
          id: ride.id,
          name: `Ruta ${index + 1}`,
          km: calculateDistanceKm(ride.coordinates),
          points: ride.coordinates.length,
        }))}
        savedAvoidZones={savedAvoidZones.map((zone, index) => ({
          id: zone.id,
          name: `Zona ${index + 1}`,
          points: Math.max(zone.coordinates.length - 1, 0),
        }))}
        onStartRide={() => setDrawingMode('ride')}
        onStartAvoidZone={() => setDrawingMode('avoid')}
        onStopDrawing={handleStopDrawing}
        onUndo={handleUndo}
        onSave={handleSave}
        onDeleteRide={handleDeleteRide}
        onDeleteAvoidZone={handleDeleteAvoidZone}
        onSearchSelect={handleResultSelect}
        onLocate={handleLocate}
      />
    </div>
  );
}
