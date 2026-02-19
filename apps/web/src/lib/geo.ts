import { type Coordinate } from '../types';

export function calculateDistanceKm(coordinates: Coordinate[]): number {
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

export function ensureClosedRing(coordinates: Coordinate[]): Coordinate[] {
  if (coordinates.length === 0) return coordinates;
  const [firstLng, firstLat] = coordinates[0];
  const [lastLng, lastLat] = coordinates[coordinates.length - 1];
  if (firstLng === lastLng && firstLat === lastLat) return coordinates;
  return [...coordinates, coordinates[0]];
}
