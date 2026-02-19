import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GeoController } from './geo.controller';
import {
  GeoService,
  type NominatimResult,
  type BoundaryResult,
} from './geo.service';

describe('GeoController', () => {
  let controller: GeoController;
  let geoService: jest.Mocked<GeoService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GeoController],
      providers: [
        {
          provide: GeoService,
          useValue: {
            geocode: jest.fn(),
            getBoundary: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GeoController>(GeoController);
    geoService = module.get(GeoService);
  });

  // ── geocode ───────────────────────────────────────────────────────────────

  describe('geocode', () => {
    describe('when a valid city query is provided', () => {
      it('GeoController.geocode when q is a valid city name should delegate to GeoService and return its results', async () => {
        // Arrange
        const nominatimResults: NominatimResult[] = [
          {
            place_id: 282071899,
            display_name: 'Ciudad de México, México',
            lat: '19.4326296',
            lon: '-99.1331785',
            type: 'administrative',
            importance: 0.85,
          },
        ];
        geoService.geocode.mockResolvedValueOnce(nominatimResults);

        // Act
        const result = await controller.geocode('Ciudad de México');

        // Assert
        expect(geoService.geocode).toHaveBeenCalledWith('Ciudad de México');
        expect(result).toEqual(nominatimResults);
      });

      it('GeoController.geocode when q has surrounding whitespace should trim before delegating to GeoService', async () => {
        // Arrange
        geoService.geocode.mockResolvedValueOnce([]);

        // Act
        await controller.geocode('  Bogotá  ');

        // Assert
        expect(geoService.geocode).toHaveBeenCalledWith('Bogotá');
      });
    });

    describe('when the query parameter is absent', () => {
      it('GeoController.geocode when q is undefined should throw BadRequestException without calling GeoService', () => {
        // Act & Assert
        expect(() =>
          controller.geocode(undefined as unknown as string),
        ).toThrow(BadRequestException);
        expect(geoService.geocode).not.toHaveBeenCalled();
      });
    });

    describe('when the query parameter contains only whitespace', () => {
      it('GeoController.geocode when q is blank whitespace should throw BadRequestException without calling GeoService', () => {
        // Act & Assert
        expect(() => controller.geocode('   ')).toThrow(BadRequestException);
        expect(geoService.geocode).not.toHaveBeenCalled();
      });
    });
  });

  // ── boundary ─────────────────────────────────────────────────────────────

  describe('boundary', () => {
    describe('when a valid query matches a polygon boundary', () => {
      it('GeoController.boundary when q is a valid city name should return the BoundaryResult from GeoService', async () => {
        // Arrange
        const boundaryResult: BoundaryResult = {
          display_name: 'Guadalajara, Jalisco, México',
          geojson: {
            type: 'Polygon',
            coordinates: [
              [
                [-103.5, 20.5],
                [-103.2, 20.5],
                [-103.2, 20.8],
                [-103.5, 20.8],
                [-103.5, 20.5],
              ],
            ],
          },
          boundingbox: ['20.5', '20.8', '-103.5', '-103.2'],
        };
        geoService.getBoundary.mockResolvedValueOnce(boundaryResult);

        // Act
        const result = await controller.boundary('Guadalajara');

        // Assert
        expect(geoService.getBoundary).toHaveBeenCalledWith('Guadalajara');
        expect(result).toEqual(boundaryResult);
      });

      it('GeoController.boundary when q has surrounding whitespace should trim before delegating to GeoService', async () => {
        // Arrange
        const boundaryResult: BoundaryResult = {
          display_name: 'Lima, Perú',
          geojson: {
            type: 'Polygon',
            coordinates: [
              [
                [-77.2, -12.2],
                [-76.8, -12.2],
                [-76.8, -11.9],
                [-77.2, -11.9],
                [-77.2, -12.2],
              ],
            ],
          },
          boundingbox: ['-12.5', '-11.7', '-77.3', '-76.7'],
        };
        geoService.getBoundary.mockResolvedValueOnce(boundaryResult);

        // Act
        await controller.boundary('  Lima  ');

        // Assert
        expect(geoService.getBoundary).toHaveBeenCalledWith('Lima');
      });
    });

    describe('when the query parameter is absent', () => {
      it('GeoController.boundary when q is undefined should throw BadRequestException without calling GeoService', async () => {
        // Act & Assert
        await expect(
          controller.boundary(undefined as unknown as string),
        ).rejects.toThrow(BadRequestException);
        expect(geoService.getBoundary).not.toHaveBeenCalled();
      });
    });

    describe('when the query parameter contains only whitespace', () => {
      it('GeoController.boundary when q is blank whitespace should throw BadRequestException without calling GeoService', async () => {
        // Act & Assert
        await expect(controller.boundary('   ')).rejects.toThrow(
          BadRequestException,
        );
        expect(geoService.getBoundary).not.toHaveBeenCalled();
      });
    });

    describe('when the query does not match any area with a polygon boundary', () => {
      it('GeoController.boundary when GeoService returns null should throw NotFoundException', async () => {
        // Arrange
        geoService.getBoundary.mockResolvedValueOnce(null);

        // Act & Assert
        await expect(
          controller.boundary('lugar-sin-polígono-xyz'),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });
});
