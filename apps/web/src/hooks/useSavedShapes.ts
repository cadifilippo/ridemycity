import { useCallback, useEffect, useState } from 'react';
import {
  RIDES_SOURCE,
  AVOID_SOURCE,
  createLineFeature,
  createPolygonFeature,
  createFeatureCollection,
  type FeatureCollection,
} from '../lib/mapLayers';
import { type Coordinate, type StoredRide, type StoredAvoidZone } from '../types';
import apiClient from '../lib/apiClient';

type UpdateSourceData = <T extends GeoJSON.Geometry>(
  sourceId: string,
  data: FeatureCollection<T>,
) => void;

export function useSavedShapes(updateSourceData: UpdateSourceData) {
  const [savedRides, setSavedRides] = useState<StoredRide[]>([]);
  const [savedAvoidZones, setSavedAvoidZones] = useState<StoredAvoidZone[]>([]);

  useEffect(() => {
    Promise.all([
      apiClient.get<StoredRide[]>('/rides'),
      apiClient.get<StoredAvoidZone[]>('/avoid-zones'),
    ]).then(([ridesRes, zonesRes]) => {
      setSavedRides(ridesRes.data);
      setSavedAvoidZones(zonesRes.data);
    });
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

  const addRide = useCallback(async (coordinates: Coordinate[]) => {
    const { data } = await apiClient.post<StoredRide>('/rides', { coordinates });
    setSavedRides(prev => [...prev, data]);
  }, []);

  const addAvoidZone = useCallback(async (coordinates: Coordinate[]) => {
    const { data } = await apiClient.post<StoredAvoidZone>('/avoid-zones', { coordinates });
    setSavedAvoidZones(prev => [...prev, data]);
  }, []);

  const deleteRide = useCallback(async (id: string) => {
    await apiClient.delete(`/rides/${id}`);
    setSavedRides(prev => prev.filter(r => r.id !== id));
  }, []);

  const deleteAvoidZone = useCallback(async (id: string) => {
    await apiClient.delete(`/avoid-zones/${id}`);
    setSavedAvoidZones(prev => prev.filter(z => z.id !== id));
  }, []);

  return { savedRides, savedAvoidZones, addRide, addAvoidZone, deleteRide, deleteAvoidZone };
}
