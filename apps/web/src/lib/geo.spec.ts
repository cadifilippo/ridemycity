import { describe, it, expect } from 'vitest';
import { calculateDistanceKm, ensureClosedRing } from './geo';

describe('calculateDistanceKm', () => {
  describe('when called with two coordinates representing a real segment', () => {
    it('calculateDistanceKm when given CDMX Zócalo to Reforma coordinates should return approximately 3.6 km', () => {
      // Arrange — Zócalo [-99.1332, 19.4326] to Ángel de Independencia [-99.1767, 19.4270]
      const coordinates: [number, number][] = [
        [-99.1332, 19.4326],
        [-99.1767, 19.427],
      ];

      // Act
      const result = calculateDistanceKm(coordinates);

      // Assert
      expect(result).toBeGreaterThan(3);
      expect(result).toBeLessThan(5);
    });

    it('calculateDistanceKm when given a longer route with multiple waypoints should sum segment distances', () => {
      // Arrange — three waypoints across Monterrey
      const coordinates: [number, number][] = [
        [-100.3161, 25.6866], // Macroplaza
        [-100.3281, 25.6953], // Barrio Antiguo
        [-100.3474, 25.7172], // Santa Catarina border
      ];

      // Act
      const result = calculateDistanceKm(coordinates);

      // Assert
      expect(result).toBeGreaterThan(4);
      expect(result).toBeLessThan(8);
    });
  });

  describe('when called with a single coordinate', () => {
    it('calculateDistanceKm when given only one point should return 0', () => {
      // Arrange
      const coordinates: [number, number][] = [[-99.1332, 19.4326]];

      // Act
      const result = calculateDistanceKm(coordinates);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('when called with an empty array', () => {
    it('calculateDistanceKm when given no coordinates should return 0', () => {
      // Arrange
      const coordinates: [number, number][] = [];

      // Act
      const result = calculateDistanceKm(coordinates);

      // Assert
      expect(result).toBe(0);
    });
  });
});

describe('ensureClosedRing', () => {
  describe('when given a ring that is already closed', () => {
    it('ensureClosedRing when first and last coordinates are identical should return the original array unchanged', () => {
      // Arrange
      const coordinates: [number, number][] = [
        [-99.1332, 19.4326],
        [-99.1767, 19.427],
        [-99.15, 19.44],
        [-99.1332, 19.4326],
      ];

      // Act
      const result = ensureClosedRing(coordinates);

      // Assert
      expect(result).toBe(coordinates); // same reference
      expect(result).toHaveLength(4);
    });
  });

  describe('when given a ring that is not closed', () => {
    it('ensureClosedRing when last coordinate differs from first should append first coordinate to close the ring', () => {
      // Arrange
      const coordinates: [number, number][] = [
        [-96.8, 17.0],
        [-96.7, 17.0],
        [-96.7, 17.1],
        [-96.8, 17.1],
      ];

      // Act
      const result = ensureClosedRing(coordinates);

      // Assert
      expect(result).toHaveLength(5);
      expect(result[4]).toEqual([-96.8, 17.0]);
    });
  });

  describe('when called with an empty array', () => {
    it('ensureClosedRing when given an empty array should return the same empty array', () => {
      // Arrange
      const coordinates: [number, number][] = [];

      // Act
      const result = ensureClosedRing(coordinates);

      // Assert
      expect(result).toBe(coordinates);
      expect(result).toHaveLength(0);
    });
  });
});
