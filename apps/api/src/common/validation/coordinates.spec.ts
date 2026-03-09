import { BadRequestException } from '@nestjs/common';
import {
  validateCoordinatePoint,
  validateCoordinates,
  validatePolygonClosure,
} from './coordinates';

describe('validateCoordinatePoint', () => {
  describe('when the point has a valid structure', () => {
    it('validateCoordinatePoint when given a valid [lng, lat] pair should not throw', () => {
      expect(() =>
        validateCoordinatePoint([-58.3816, -34.6037], 0),
      ).not.toThrow();
    });

    it('validateCoordinatePoint when given boundary values [180, 90] should not throw', () => {
      expect(() => validateCoordinatePoint([180, 90], 0)).not.toThrow();
    });

    it('validateCoordinatePoint when given boundary values [-180, -90] should not throw', () => {
      expect(() => validateCoordinatePoint([-180, -90], 0)).not.toThrow();
    });

    it('validateCoordinatePoint when given zero coordinates [0, 0] should not throw', () => {
      expect(() => validateCoordinatePoint([0, 0], 0)).not.toThrow();
    });
  });

  describe('when the point has an invalid structure', () => {
    it('validateCoordinatePoint when given a single-element array should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint([10], 0)).toThrow(
        BadRequestException,
      );
      expect(() => validateCoordinatePoint([10], 0)).toThrow(
        'Invalid coordinate at index 0',
      );
    });

    it('validateCoordinatePoint when given a three-element array should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint([10, 20, 30], 2)).toThrow(
        BadRequestException,
      );
      expect(() => validateCoordinatePoint([10, 20, 30], 2)).toThrow(
        'Invalid coordinate at index 2',
      );
    });

    it('validateCoordinatePoint when given an empty array should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint([], 0)).toThrow(BadRequestException);
    });

    it('validateCoordinatePoint when given a string value should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint(['abc', 20], 1)).toThrow(
        BadRequestException,
      );
    });

    it('validateCoordinatePoint when given null value should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint([null, 20], 0)).toThrow(
        BadRequestException,
      );
    });

    it('validateCoordinatePoint when given NaN should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint([NaN, 20], 0)).toThrow(
        BadRequestException,
      );
    });

    it('validateCoordinatePoint when given Infinity should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint([Infinity, 20], 0)).toThrow(
        BadRequestException,
      );
    });

    it('validateCoordinatePoint when given -Infinity should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint([10, -Infinity], 0)).toThrow(
        BadRequestException,
      );
    });

    it('validateCoordinatePoint when given undefined should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint(undefined, 0)).toThrow(
        BadRequestException,
      );
    });

    it('validateCoordinatePoint when given a non-array value should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint('not-an-array', 0)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('when the point has out-of-range coordinates', () => {
    it('validateCoordinatePoint when longitude exceeds 180 should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint([200, 45], 0)).toThrow(
        BadRequestException,
      );
      expect(() => validateCoordinatePoint([200, 45], 0)).toThrow(
        'longitude must be between -180 and 180',
      );
    });

    it('validateCoordinatePoint when longitude is below -180 should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint([-181, 45], 3)).toThrow(
        BadRequestException,
      );
      expect(() => validateCoordinatePoint([-181, 45], 3)).toThrow(
        'Coordinate at index 3',
      );
    });

    it('validateCoordinatePoint when latitude exceeds 90 should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint([-70, 95], 0)).toThrow(
        BadRequestException,
      );
      expect(() => validateCoordinatePoint([-70, 95], 0)).toThrow(
        'latitude must be between -90 and 90',
      );
    });

    it('validateCoordinatePoint when latitude is below -90 should throw BadRequestException', () => {
      expect(() => validateCoordinatePoint([-70, -91], 0)).toThrow(
        BadRequestException,
      );
    });
  });
});

describe('validateCoordinates', () => {
  describe('when all coordinates are valid', () => {
    it('validateCoordinates when given a valid polyline should not throw', () => {
      const coordinates = [
        [-58.3816, -34.6037],
        [-58.3815, -34.6038],
        [-58.382, -34.604],
      ];
      expect(() => validateCoordinates(coordinates)).not.toThrow();
    });
  });

  describe('when coordinates contain an invalid point', () => {
    it('validateCoordinates when the second point is invalid should throw with index 1', () => {
      const coordinates = [
        [-58.3816, -34.6037],
        [NaN, -34.6038],
      ];
      expect(() => validateCoordinates(coordinates)).toThrow(
        BadRequestException,
      );
      expect(() => validateCoordinates(coordinates)).toThrow('index 1');
    });

    it('validateCoordinates when the third point has out-of-range longitude should throw with index 2', () => {
      const coordinates = [
        [-58.3816, -34.6037],
        [-58.3815, -34.6038],
        [999, -34.604],
      ];
      expect(() => validateCoordinates(coordinates)).toThrow(
        BadRequestException,
      );
      expect(() => validateCoordinates(coordinates)).toThrow('index 2');
    });
  });
});

describe('validatePolygonClosure', () => {
  describe('when the polygon is closed', () => {
    it('validatePolygonClosure when first and last points match should not throw', () => {
      const coordinates = [
        [-58.38, -34.6],
        [-58.37, -34.6],
        [-58.37, -34.61],
        [-58.38, -34.61],
        [-58.38, -34.6],
      ];
      expect(() => validatePolygonClosure(coordinates)).not.toThrow();
    });

    it('validatePolygonClosure when given a minimum 4-point closed polygon should not throw', () => {
      const coordinates = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
      ];
      expect(() => validatePolygonClosure(coordinates)).not.toThrow();
    });
  });

  describe('when the polygon is not closed', () => {
    it('validatePolygonClosure when first and last points differ should throw BadRequestException', () => {
      const coordinates = [
        [-58.38, -34.6],
        [-58.37, -34.6],
        [-58.37, -34.61],
        [-58.38, -34.61],
      ];
      expect(() => validatePolygonClosure(coordinates)).toThrow(
        BadRequestException,
      );
      expect(() => validatePolygonClosure(coordinates)).toThrow(
        'Polygon must be closed',
      );
    });

    it('validatePolygonClosure when only longitude matches should throw BadRequestException', () => {
      const coordinates = [
        [10, 20],
        [11, 20],
        [11, 21],
        [10, 21],
      ];
      expect(() => validatePolygonClosure(coordinates)).toThrow(
        BadRequestException,
      );
    });
  });
});
