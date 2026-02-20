import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RIDES_SOURCE,
  AVOID_SOURCE,
  createLineFeature,
  createPolygonFeature,
  createFeatureCollection,
  type FeatureCollection,
} from '../lib/mapLayers';
import { type Coordinate, type StoredRide, type StoredAvoidZone } from '../types';

type UpdateSourceData = <T extends GeoJSON.Geometry>(
  sourceId: string,
  data: FeatureCollection<T>,
) => void;

export function useSavedShapes(updateSourceData: UpdateSourceData) {
  const [savedRides, setSavedRides] = useState<StoredRide[]>([]);
  const [savedAvoidZones, setSavedAvoidZones] = useState<StoredAvoidZone[]>([]);
  const rideCounterRef = useRef(0);
  const avoidCounterRef = useRef(0);

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

  const addRide = useCallback((coordinates: Coordinate[]) => {
    rideCounterRef.current += 1;
    const id = `ride-${rideCounterRef.current}`;
    setSavedRides(prev => [...prev, { id, coordinates }]);
  }, []);

  const addAvoidZone = useCallback((coordinates: Coordinate[]) => {
    avoidCounterRef.current += 1;
    const id = `avoid-${avoidCounterRef.current}`;
    setSavedAvoidZones(prev => [...prev, { id, coordinates }]);
  }, []);

  const deleteRide = useCallback((id: string) => {
    setSavedRides(prev => prev.filter(r => r.id !== id));
  }, []);

  const deleteAvoidZone = useCallback((id: string) => {
    setSavedAvoidZones(prev => prev.filter(z => z.id !== id));
  }, []);

  return { savedRides, savedAvoidZones, addRide, addAvoidZone, deleteRide, deleteAvoidZone };
}
