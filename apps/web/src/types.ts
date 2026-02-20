export type Coordinate = [number, number];
export type DrawingMode = 'ride' | 'avoid' | null;
export type StoredRide = { id: string; coordinates: Coordinate[] };
export type StoredAvoidZone = { id: string; coordinates: Coordinate[] };

type PolygonGeometry = { type: 'Polygon'; coordinates: number[][][] };
type MultiPolygonGeometry = { type: 'MultiPolygon'; coordinates: number[][][][] };
export type CityGeometry = PolygonGeometry | MultiPolygonGeometry;

export interface GeoResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export interface Stats {
  totalKm: number;
  totalRides: number;
}
