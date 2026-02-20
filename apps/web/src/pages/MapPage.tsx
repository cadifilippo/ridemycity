import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapPage.css';
import apiClient from '../lib/apiClient';
import {
  type Coordinate,
  type DrawingMode,
  type StoredRide,
  type StoredAvoidZone,
  type CityGeometry,
  type GeoResult,
} from '../types';
import {
  RIDES_SOURCE,
  RIDES_LAYER,
  AVOID_SOURCE,
  AVOID_FILL_LAYER,
  AVOID_OUTLINE_LAYER,
  SELECTED_RIDE_SOURCE,
  SELECTED_RIDE_GLOW_LAYER,
  SELECTED_RIDE_LAYER,
  SELECTED_AVOID_SOURCE,
  SELECTED_AVOID_FILL_LAYER,
  SELECTED_AVOID_OUTLINE_LAYER,
  DRAFT_LINE_SOURCE,
  DRAFT_LINE_LAYER,
  DRAFT_POLYGON_SOURCE,
  DRAFT_POLYGON_FILL_LAYER,
  DRAFT_POLYGON_OUTLINE_LAYER,
  clearBoundary,
  drawBoundary,
  createLineFeature,
  createPolygonFeature,
  createFeatureCollection,
  createDraftPointElement,
  type FeatureCollection,
} from '../lib/mapLayers';
import { calculateDistanceKm, ensureClosedRing } from '../lib/geo';
import RideSidebar from '../components/sidebar/RideSidebar';

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
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const EMPTY_STATS = { totalKm: 0, cityExplored: 0, totalRides: 0 };

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

export default function MapPage() {
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
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [selectedAvoidId, setSelectedAvoidId] = useState<string | null>(null);

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

  // ── Map initialisation ──────────────────────────────────────────────────────
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
        data: createFeatureCollection(
          INITIAL_RIDES.map(ride => createLineFeature(ride.coordinates)),
        ) as GeoJSON.GeoJSON,
      });
      map.addLayer({
        id: RIDES_LAYER,
        type: 'line',
        source: RIDES_SOURCE,
        paint: { 'line-color': '#60a5fa', 'line-width': 4, 'line-opacity': 0.72 },
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
        paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.18 },
      });
      map.addLayer({
        id: AVOID_OUTLINE_LAYER,
        type: 'line',
        source: AVOID_SOURCE,
        paint: { 'line-color': '#dc2626', 'line-width': 2, 'line-dasharray': [2, 2] },
      });

      map.addSource(SELECTED_RIDE_SOURCE, {
        type: 'geojson',
        data: createFeatureCollection<GeoJSON.LineString>([]) as GeoJSON.GeoJSON,
      });
      map.addLayer({
        id: SELECTED_RIDE_GLOW_LAYER,
        type: 'line',
        source: SELECTED_RIDE_SOURCE,
        paint: { 'line-color': '#ffffff', 'line-width': 13, 'line-opacity': 0.85 },
      });
      map.addLayer({
        id: SELECTED_RIDE_LAYER,
        type: 'line',
        source: SELECTED_RIDE_SOURCE,
        paint: { 'line-color': '#ff6600', 'line-width': 7, 'line-opacity': 1 },
      });

      map.addSource(SELECTED_AVOID_SOURCE, {
        type: 'geojson',
        data: createFeatureCollection<GeoJSON.Polygon>([]) as GeoJSON.GeoJSON,
      });
      map.addLayer({
        id: SELECTED_AVOID_FILL_LAYER,
        type: 'fill',
        source: SELECTED_AVOID_SOURCE,
        paint: { 'fill-color': '#f97316', 'fill-opacity': 0.3 },
      });
      map.addLayer({
        id: SELECTED_AVOID_OUTLINE_LAYER,
        type: 'line',
        source: SELECTED_AVOID_SOURCE,
        paint: { 'line-color': '#f97316', 'line-width': 3 },
      });

      map.addSource(DRAFT_LINE_SOURCE, {
        type: 'geojson',
        data: createFeatureCollection<GeoJSON.LineString>([]) as GeoJSON.GeoJSON,
      });
      map.addLayer({
        id: DRAFT_LINE_LAYER,
        type: 'line',
        source: DRAFT_LINE_SOURCE,
        paint: { 'line-color': '#22c55e', 'line-width': 4, 'line-opacity': 0.95 },
      });

      map.addSource(DRAFT_POLYGON_SOURCE, {
        type: 'geojson',
        data: createFeatureCollection<GeoJSON.Polygon>([]) as GeoJSON.GeoJSON,
      });
      map.addLayer({
        id: DRAFT_POLYGON_FILL_LAYER,
        type: 'fill',
        source: DRAFT_POLYGON_SOURCE,
        paint: { 'fill-color': '#ef4444', 'fill-opacity': 0.22 },
      });
      map.addLayer({
        id: DRAFT_POLYGON_OUTLINE_LAYER,
        type: 'line',
        source: DRAFT_POLYGON_SOURCE,
        paint: { 'line-color': '#ef4444', 'line-width': 2 },
      });

      navigator.geolocation.getCurrentPosition(({ coords }) => {
        map.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14, speed: 1.4 });
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Sync saved data to map layers ───────────────────────────────────────────
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

  // ── Map interaction (click + mousemove) ─────────────────────────────────────
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

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleSearchSelect(result: GeoResult) {
    if (mapRef.current) clearBoundary(mapRef.current);

    mapRef.current?.flyTo({
      center: [parseFloat(result.lon), parseFloat(result.lat)],
      zoom: 14,
      speed: 1.4,
    });

    const res = await apiClient.get<{ geojson: CityGeometry }>(
      `/geo/boundary?q=${encodeURIComponent(result.display_name)}`,
    );
    if (mapRef.current) drawBoundary(mapRef.current, res.data.geojson);
  }

  function handleLocate() {
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (mapRef.current) clearBoundary(mapRef.current);
      mapRef.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14, speed: 1.4 });
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
        const nextRides = [...prev, { id: createShapeId('ride'), coordinates: pointsToSave }];
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
          { id: createShapeId('avoid'), coordinates: ensureClosedRing(pointsToSave) },
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

  function setSelectionDim(dimmed: boolean) {
    const map = mapRef.current;
    if (!map) return;
    map.setPaintProperty(RIDES_LAYER, 'line-opacity', dimmed ? 0.15 : 0.72);
    map.setPaintProperty(AVOID_FILL_LAYER, 'fill-opacity', dimmed ? 0.05 : 0.18);
    map.setPaintProperty(AVOID_OUTLINE_LAYER, 'line-opacity', dimmed ? 0.15 : 1);
  }

  function handleSelectRide(id: string) {
    const map = mapRef.current;
    if (!map) return;

    setSelectedAvoidId(null);
    updateSourceData(SELECTED_AVOID_SOURCE, createFeatureCollection<GeoJSON.Polygon>([]));

    if (selectedRideId === id) {
      setSelectedRideId(null);
      updateSourceData(SELECTED_RIDE_SOURCE, createFeatureCollection<GeoJSON.LineString>([]));
      setSelectionDim(false);
      return;
    }

    setSelectedRideId(id);
    const ride = savedRides.find(r => r.id === id);
    if (!ride) return;

    updateSourceData(
      SELECTED_RIDE_SOURCE,
      createFeatureCollection([createLineFeature(ride.coordinates)]),
    );
    setSelectionDim(true);

    const lngs = ride.coordinates.map(c => c[0]);
    const lats = ride.coordinates.map(c => c[1]);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: { top: 80, bottom: 80, left: 360, right: 80 }, maxZoom: 16 },
    );
  }

  function handleSelectAvoidZone(id: string) {
    const map = mapRef.current;
    if (!map) return;

    setSelectedRideId(null);
    updateSourceData(SELECTED_RIDE_SOURCE, createFeatureCollection<GeoJSON.LineString>([]));

    if (selectedAvoidId === id) {
      setSelectedAvoidId(null);
      updateSourceData(SELECTED_AVOID_SOURCE, createFeatureCollection<GeoJSON.Polygon>([]));
      setSelectionDim(false);
      return;
    }

    setSelectedAvoidId(id);
    const zone = savedAvoidZones.find(z => z.id === id);
    if (!zone) return;

    updateSourceData(
      SELECTED_AVOID_SOURCE,
      createFeatureCollection([createPolygonFeature(zone.coordinates)]),
    );
    setSelectionDim(true);

    const lngs = zone.coordinates.map(c => c[0]);
    const lats = zone.coordinates.map(c => c[1]);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: { top: 80, bottom: 80, left: 360, right: 80 }, maxZoom: 16 },
    );
  }

  function handleDeleteRide(id: string) {
    if (selectedRideId === id) {
      setSelectedRideId(null);
      updateSourceData(SELECTED_RIDE_SOURCE, createFeatureCollection<GeoJSON.LineString>([]));
      setSelectionDim(false);
    }
    setSavedRides(prev => prev.filter(r => r.id !== id));
  }

  function handleDeleteAvoidZone(id: string) {
    if (selectedAvoidId === id) {
      setSelectedAvoidId(null);
      updateSourceData(SELECTED_AVOID_SOURCE, createFeatureCollection<GeoJSON.Polygon>([]));
      setSelectionDim(false);
    }
    setSavedAvoidZones(prev => prev.filter(z => z.id !== id));
  }

  function handleStartRide() {
    clearDraft();
    setDrawingMode('ride');
  }

  function handleStartAvoidZone() {
    clearDraft();
    setDrawingMode('avoid');
  }

  return (
    <div className="map-wrapper">
      <div ref={containerRef} className="map-container" />
      <RideSidebar
        drawingMode={drawingMode}
        estimatedKm={estimatedKm}
        stats={EMPTY_STATS}
        savedRides={savedRides.map((ride, index) => ({
          id: ride.id,
          name: `Salida ${index + 1}`,
          km: calculateDistanceKm(ride.coordinates),
          points: ride.coordinates.length,
        }))}
        savedAvoidZones={savedAvoidZones.map((zone, index) => ({
          id: zone.id,
          name: `Zona ${index + 1}`,
          points: Math.max(zone.coordinates.length - 1, 0),
        }))}
        onStartRide={handleStartRide}
        onStartAvoidZone={handleStartAvoidZone}
        onStopDrawing={handleStopDrawing}
        onUndo={handleUndo}
        onSave={handleSave}
        onDeleteRide={handleDeleteRide}
        onDeleteAvoidZone={handleDeleteAvoidZone}
        onSelectRide={handleSelectRide}
        onSelectAvoidZone={handleSelectAvoidZone}
        selectedRideId={selectedRideId}
        selectedAvoidId={selectedAvoidId}
        onSearchSelect={handleSearchSelect}
        onLocate={handleLocate}
      />
    </div>
  );
}
