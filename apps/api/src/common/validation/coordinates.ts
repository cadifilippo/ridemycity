import { BadRequestException } from '@nestjs/common';

export type CoordinatePoint = [longitude: number, latitude: number];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidPointStructure(point: unknown): point is [number, number] {
  return (
    Array.isArray(point) &&
    point.length === 2 &&
    isFiniteNumber(point[0]) &&
    isFiniteNumber(point[1])
  );
}

export function validateCoordinatePoint(point: unknown, index: number): void {
  if (!isValidPointStructure(point)) {
    throw new BadRequestException(
      `Invalid coordinate at index ${index}: each point must be [longitude, latitude] with finite numbers`,
    );
  }

  const [lng, lat] = point;
  const isOutOfRange = (val, min, max) => val < min || val > max;

  if (isOutOfRange(lng, -180, 180)) {
    throw new BadRequestException(
      `Coordinate at index ${index}: longitude must be between -180 and 180`,
    );
  }

  if (isOutOfRange(lat, -90, 90)) {
    throw new BadRequestException(
      `Coordinate at index ${index}: latitude must be between -90 and 90`,
    );
  }
}

export function validateCoordinates(coordinates: unknown[]): void {
  for (let i = 0; i < coordinates.length; i++) {
    validateCoordinatePoint(coordinates[i], i);
  }
}

export function validatePolygonClosure(coordinates: number[][]): void {
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    throw new BadRequestException(
      'Polygon must be closed: first and last coordinates must be identical',
    );
  }
}
