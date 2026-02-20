import { useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  RIDES_LAYER,
  AVOID_FILL_LAYER,
  AVOID_OUTLINE_LAYER,
  SELECTED_RIDE_SOURCE,
  SELECTED_AVOID_SOURCE,
  createLineFeature,
  createPolygonFeature,
  createFeatureCollection,
  type FeatureCollection,
} from '../lib/mapLayers';
import { type StoredRide, type StoredAvoidZone } from '../types';

type UpdateSourceData = <T extends GeoJSON.Geometry>(
  sourceId: string,
  data: FeatureCollection<T>,
) => void;

export function useSelection(
  mapRef: React.RefObject<maplibregl.Map | null>,
  savedRides: StoredRide[],
  savedAvoidZones: StoredAvoidZone[],
  updateSourceData: UpdateSourceData,
) {
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [selectedAvoidId, setSelectedAvoidId] = useState<string | null>(null);

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

    const ride = savedRides.find(r => r.id === id);
    if (!ride) return;

    setSelectedRideId(id);
    updateSourceData(
      SELECTED_RIDE_SOURCE,
      createFeatureCollection([createLineFeature(ride.coordinates)]),
    );
    setSelectionDim(true);

    const lngs = ride.coordinates.map(c => c[0]);
    const lats = ride.coordinates.map(c => c[1]);
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
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

    const zone = savedAvoidZones.find(z => z.id === id);
    if (!zone) return;

    setSelectedAvoidId(id);
    updateSourceData(
      SELECTED_AVOID_SOURCE,
      createFeatureCollection([createPolygonFeature(zone.coordinates)]),
    );
    setSelectionDim(true);

    const lngs = zone.coordinates.map(c => c[0]);
    const lats = zone.coordinates.map(c => c[1]);
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: { top: 80, bottom: 80, left: 360, right: 80 }, maxZoom: 16 },
    );
  }

  return { selectedRideId, selectedAvoidId, handleSelectRide, handleSelectAvoidZone };
}
