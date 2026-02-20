import { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  DRAFT_LINE_SOURCE,
  DRAFT_POLYGON_SOURCE,
  createLineFeature,
  createPolygonFeature,
  createFeatureCollection,
  createDraftPointElement,
  type FeatureCollection,
} from '../lib/mapLayers';
import { calculateDistanceKm, ensureClosedRing } from '../lib/geo';
import { type Coordinate, type DrawingMode } from '../types';

type UpdateSourceData = <T extends GeoJSON.Geometry>(
  sourceId: string,
  data: FeatureCollection<T>,
) => void;

interface SaveCallbacks {
  addRide: (coordinates: Coordinate[]) => Promise<void>;
  addAvoidZone: (coordinates: Coordinate[]) => Promise<void>;
}

export function useDrawing(
  mapRef: React.RefObject<maplibregl.Map | null>,
  updateSourceData: UpdateSourceData,
  { addRide, addAvoidZone }: SaveCallbacks,
) {
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null);
  const [estimatedKm, setEstimatedKm] = useState(0);

  const drawingPointsRef = useRef<Coordinate[]>([]);
  const cursorPointRef = useRef<Coordinate | null>(null);
  const draftMarkersRef = useRef<maplibregl.Marker[]>([]);

  const updateDraftLayers = useCallback(() => {
    const points = drawingPointsRef.current;
    const cursor = cursorPointRef.current;

    const lineCoords =
      drawingMode === 'ride' && cursor && points.length > 0 ? [...points, cursor] : points;
    const lineFeatures = lineCoords.length > 1 ? [createLineFeature(lineCoords)] : [];

    const polygonCoords =
      drawingMode === 'avoid' && points.length > 2 ? ensureClosedRing(points) : [];
    const polygonFeatures = polygonCoords.length > 3 ? [createPolygonFeature(polygonCoords)] : [];

    updateSourceData(DRAFT_LINE_SOURCE, createFeatureCollection(lineFeatures));
    updateSourceData(DRAFT_POLYGON_SOURCE, createFeatureCollection(polygonFeatures));
  }, [drawingMode, updateSourceData]);

  const clearDraft = useCallback(() => {
    drawingPointsRef.current = [];
    cursorPointRef.current = null;
    draftMarkersRef.current.forEach(m => m.remove());
    draftMarkersRef.current = [];
    setEstimatedKm(0);
    updateSourceData(DRAFT_LINE_SOURCE, createFeatureCollection([]));
    updateSourceData(DRAFT_POLYGON_SOURCE, createFeatureCollection([]));
  }, [updateSourceData]);

  // Map interaction events
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
  }, [drawingMode, mapRef, updateDraftLayers]);

  function handleStartRide() {
    clearDraft();
    setDrawingMode('ride');
  }

  function handleStartAvoidZone() {
    clearDraft();
    setDrawingMode('avoid');
  }

  function handleStopDrawing() {
    clearDraft();
    setDrawingMode(null);
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

  function handleSave() {
    const points = [...drawingPointsRef.current];
    if (drawingMode === 'ride' && points.length > 1) {
      addRide(points);
    }
    if (drawingMode === 'avoid' && points.length > 2) {
      addAvoidZone(ensureClosedRing(points));
    }
    clearDraft();
    setDrawingMode(null);
  }

  return {
    drawingMode,
    estimatedKm,
    handleStartRide,
    handleStartAvoidZone,
    handleStopDrawing,
    handleUndo,
    handleSave,
  };
}
