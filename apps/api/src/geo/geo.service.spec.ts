import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { GeoService, type NominatimResult, type BoundaryResult } from './geo.service';

describe('GeoService', () => {
  let service: GeoService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeoService],
    }).compile();

    service = module.get<GeoService>(GeoService);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── geocode ───────────────────────────────────────────────────────────────

  describe('geocode', () => {
    describe('when Nominatim returns results for a valid query', () => {
      it('GeoService.geocode when Nominatim returns a list of places should return the parsed NominatimResult array', async () => {
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
          {
            place_id: 123456789,
            display_name: 'México, América del Norte',
            lat: '23.6260333',
            lon: '-102.5375005',
            type: 'country',
            importance: 0.76,
          },
        ];
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(nominatimResults),
        } as unknown as Response);

        // Act
        const result = await service.geocode('México');

        // Assert
        expect(result).toEqual(nominatimResults);
      });

      it('GeoService.geocode when called with a city name should send q, format, and limit=5 to Nominatim', async () => {
        // Arrange
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as unknown as Response);

        // Act
        await service.geocode('Barcelona');

        // Assert
        const calledUrl = new URL(fetchSpy.mock.calls[0][0] as string);
        expect(calledUrl.searchParams.get('q')).toBe('Barcelona');
        expect(calledUrl.searchParams.get('format')).toBe('json');
        expect(calledUrl.searchParams.get('limit')).toBe('5');
      });
    });

    describe('when Nominatim responds with a non-ok HTTP status', () => {
      it('GeoService.geocode when Nominatim responds with 503 should throw InternalServerErrorException', async () => {
        // Arrange
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 503,
        } as unknown as Response);

        // Act & Assert
        await expect(service.geocode('Madrid')).rejects.toThrow(
          InternalServerErrorException,
        );
      });

      it('GeoService.geocode when Nominatim responds with 429 should throw InternalServerErrorException', async () => {
        // Arrange
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 429,
        } as unknown as Response);

        // Act & Assert
        await expect(service.geocode('Buenos Aires')).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  // ── getBoundary ───────────────────────────────────────────────────────────

  describe('getBoundary', () => {
    describe('when Nominatim returns a Polygon geometry', () => {
      it('GeoService.getBoundary when Nominatim returns a Polygon geojson should return the full BoundaryResult', async () => {
        // Arrange
        const boundaryResult: BoundaryResult = {
          display_name: 'Oaxaca de Juárez, Oaxaca, México',
          geojson: {
            type: 'Polygon',
            coordinates: [
              [
                [-96.8, 17.0],
                [-96.7, 17.0],
                [-96.7, 17.1],
                [-96.8, 17.1],
                [-96.8, 17.0],
              ],
            ],
          },
          boundingbox: ['16.9', '17.2', '-97.0', '-96.6'],
        };
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([boundaryResult]),
        } as unknown as Response);

        // Act
        const result = await service.getBoundary('Oaxaca de Juárez');

        // Assert
        expect(result).toEqual(boundaryResult);
      });
    });

    describe('when Nominatim returns a MultiPolygon geometry', () => {
      it('GeoService.getBoundary when Nominatim returns a MultiPolygon geojson should return the full BoundaryResult', async () => {
        // Arrange
        const boundaryResult: BoundaryResult = {
          display_name: 'México',
          geojson: {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [-99.0, 19.0],
                  [-98.0, 19.0],
                  [-98.0, 20.0],
                  [-99.0, 20.0],
                  [-99.0, 19.0],
                ],
              ],
            ],
          },
          boundingbox: ['14.5', '32.7', '-118.4', '-86.7'],
        };
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([boundaryResult]),
        } as unknown as Response);

        // Act
        const result = await service.getBoundary('México');

        // Assert
        expect(result).toEqual(boundaryResult);
      });
    });

    describe('when Nominatim returns a Point geometry instead of a boundary', () => {
      it('GeoService.getBoundary when Nominatim returns a Point geojson should return null', async () => {
        // Arrange
        const pointResult: BoundaryResult = {
          display_name: 'Ángel de la Independencia, Paseo de la Reforma, Ciudad de México',
          geojson: { type: 'Point', coordinates: [-99.1767, 19.427] },
          boundingbox: ['19.426', '19.428', '-99.178', '-99.175'],
        };
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([pointResult]),
        } as unknown as Response);

        // Act
        const result = await service.getBoundary('Ángel de la Independencia');

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('when Nominatim returns no results for the query', () => {
      it('GeoService.getBoundary when Nominatim returns an empty array should return null', async () => {
        // Arrange
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as unknown as Response);

        // Act
        const result = await service.getBoundary('xyz-lugar-inexistente-123');

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('when called with a valid query', () => {
      it('GeoService.getBoundary when called should request polygon_geojson=1 and limit=1 from Nominatim', async () => {
        // Arrange
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as unknown as Response);

        // Act
        await service.getBoundary('Monterrey');

        // Assert
        const calledUrl = new URL(fetchSpy.mock.calls[0][0] as string);
        expect(calledUrl.searchParams.get('q')).toBe('Monterrey');
        expect(calledUrl.searchParams.get('polygon_geojson')).toBe('1');
        expect(calledUrl.searchParams.get('limit')).toBe('1');
      });
    });

    describe('when Nominatim responds with a non-ok HTTP status', () => {
      it('GeoService.getBoundary when Nominatim responds with 500 should throw InternalServerErrorException', async () => {
        // Arrange
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as unknown as Response);

        // Act & Assert
        await expect(service.getBoundary('Guadalajara')).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });
});
