import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RidesService } from './rides.service';
import { getAdminDb } from '../auth/firebase-admin';

jest.mock('../auth/firebase-admin', () => ({
  getAdminDb: jest.fn(),
}));

const mockGetAdminDb = getAdminDb as jest.Mock;

describe('RidesService', () => {
  let service: RidesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RidesService],
    }).compile();

    service = module.get<RidesService>(RidesService);
    mockGetAdminDb.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── findByUser ─────────────────────────────────────────────────────────────

  describe('findByUser', () => {
    describe('when the user has saved rides', () => {
      it('RidesService.findByUser when Firestore returns matching docs should return rides with parsed coordinates', async () => {
        // Arrange
        const uid = 'user-cdmx-01';
        const coordinates = [
          [-99.1332, 19.4326],
          [-99.14, 19.438],
        ];
        const mockGet = jest.fn().mockResolvedValue({
          docs: [
            {
              id: 'ride-ab12cd34',
              data: () => ({ coordinates: JSON.stringify(coordinates) }),
            },
          ],
        });
        const mockWhere = jest.fn().mockReturnValue({ get: mockGet });
        mockGetAdminDb.mockReturnValue({
          collection: jest.fn().mockReturnValue({ where: mockWhere }),
        });

        // Act
        const result = await service.findByUser(uid);

        // Assert
        expect(result).toEqual([{ id: 'ride-ab12cd34', coordinates }]);
      });

      it('RidesService.findByUser when called should query the rides collection filtered by uid', async () => {
        // Arrange
        const uid = 'user-gdl-02';
        const mockGet = jest.fn().mockResolvedValue({ docs: [] });
        const mockWhere = jest.fn().mockReturnValue({ get: mockGet });
        const mockCollection = jest.fn().mockReturnValue({ where: mockWhere });
        mockGetAdminDb.mockReturnValue({ collection: mockCollection });

        // Act
        await service.findByUser(uid);

        // Assert
        expect(mockCollection).toHaveBeenCalledWith('rides');
        expect(mockWhere).toHaveBeenCalledWith('uid', '==', uid);
      });
    });

    describe('when the user has no saved rides', () => {
      it('RidesService.findByUser when Firestore returns no docs should return an empty array', async () => {
        // Arrange
        const uid = 'user-mty-03';
        const mockGet = jest.fn().mockResolvedValue({ docs: [] });
        const mockWhere = jest.fn().mockReturnValue({ get: mockGet });
        mockGetAdminDb.mockReturnValue({
          collection: jest.fn().mockReturnValue({ where: mockWhere }),
        });

        // Act
        const result = await service.findByUser(uid);

        // Assert
        expect(result).toEqual([]);
      });
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    describe('when valid coordinates are provided', () => {
      it('RidesService.create when coordinates are valid should persist them as a JSON string and return the new ride', async () => {
        // Arrange
        const uid = 'user-oax-04';
        const coordinates = [
          [-96.7269, 17.0669],
          [-96.735, 17.072],
          [-96.74, 17.08],
        ];
        const mockAdd = jest.fn().mockResolvedValue({ id: 'ride-ef56gh78' });
        mockGetAdminDb.mockReturnValue({
          collection: jest.fn().mockReturnValue({ add: mockAdd }),
        });

        // Act
        const result = await service.create(uid, coordinates);

        // Assert
        expect(mockAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            uid,
            coordinates: JSON.stringify(coordinates),
          }),
        );
        expect(result).toEqual({ id: 'ride-ef56gh78', coordinates });
      });
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    describe('when the ride does not exist in Firestore', () => {
      it('RidesService.delete when the document does not exist should throw NotFoundException', async () => {
        // Arrange
        const uid = 'user-pue-05';
        const mockDocGet = jest.fn().mockResolvedValue({ exists: false });
        const mockRef = { get: mockDocGet, delete: jest.fn() };
        mockGetAdminDb.mockReturnValue({
          collection: jest
            .fn()
            .mockReturnValue({ doc: jest.fn().mockReturnValue(mockRef) }),
        });

        // Act & Assert
        await expect(service.delete(uid, 'ride-nonexistent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('when the ride belongs to a different user', () => {
      it('RidesService.delete when the stored uid does not match the requester should throw ForbiddenException', async () => {
        // Arrange
        const uid = 'user-slp-06';
        const otherUid = 'user-ver-99';
        const mockDocGet = jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ uid: otherUid }),
        });
        const mockRef = { get: mockDocGet, delete: jest.fn() };
        mockGetAdminDb.mockReturnValue({
          collection: jest
            .fn()
            .mockReturnValue({ doc: jest.fn().mockReturnValue(mockRef) }),
        });

        // Act & Assert
        await expect(service.delete(uid, 'ride-ij90kl12')).rejects.toThrow(
          ForbiddenException,
        );
      });
    });

    describe('when the ride belongs to the requester', () => {
      it('RidesService.delete when uid matches should call Firestore delete exactly once', async () => {
        // Arrange
        const uid = 'user-zac-07';
        const mockDelete = jest.fn().mockResolvedValue(undefined);
        const mockDocGet = jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ uid }),
        });
        const mockRef = { get: mockDocGet, delete: mockDelete };
        mockGetAdminDb.mockReturnValue({
          collection: jest
            .fn()
            .mockReturnValue({ doc: jest.fn().mockReturnValue(mockRef) }),
        });

        // Act
        await service.delete(uid, 'ride-mn34op56');

        // Assert
        expect(mockDelete).toHaveBeenCalledTimes(1);
      });
    });
  });
});
