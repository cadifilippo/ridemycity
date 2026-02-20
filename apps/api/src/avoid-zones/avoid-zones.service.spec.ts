import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { AvoidZonesService } from './avoid-zones.service';
import { getAdminDb } from '../auth/firebase-admin';

jest.mock('../auth/firebase-admin', () => ({
  getAdminDb: jest.fn(),
}));

const mockGetAdminDb = getAdminDb as jest.Mock;

describe('AvoidZonesService', () => {
  let service: AvoidZonesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AvoidZonesService],
    }).compile();

    service = module.get<AvoidZonesService>(AvoidZonesService);
    mockGetAdminDb.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── findByUser ─────────────────────────────────────────────────────────────

  describe('findByUser', () => {
    describe('when the user has saved avoid zones', () => {
      it('AvoidZonesService.findByUser when Firestore returns matching docs should return zones with parsed coordinates', async () => {
        // Arrange
        const uid = 'user-cdmx-01';
        const coordinates = [
          [-99.15, 19.44],
          [-99.13, 19.44],
          [-99.13, 19.45],
          [-99.15, 19.45],
          [-99.15, 19.44],
        ];
        const mockGet = jest.fn().mockResolvedValue({
          docs: [
            {
              id: 'zone-ab12cd34',
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
        expect(result).toEqual([{ id: 'zone-ab12cd34', coordinates }]);
      });

      it('AvoidZonesService.findByUser when called should query the avoidZones collection filtered by uid', async () => {
        // Arrange
        const uid = 'user-gdl-02';
        const mockGet = jest.fn().mockResolvedValue({ docs: [] });
        const mockWhere = jest.fn().mockReturnValue({ get: mockGet });
        const mockCollection = jest.fn().mockReturnValue({ where: mockWhere });
        mockGetAdminDb.mockReturnValue({ collection: mockCollection });

        // Act
        await service.findByUser(uid);

        // Assert
        expect(mockCollection).toHaveBeenCalledWith('avoidZones');
        expect(mockWhere).toHaveBeenCalledWith('uid', '==', uid);
      });
    });

    describe('when the user has no saved avoid zones', () => {
      it('AvoidZonesService.findByUser when Firestore returns no docs should return an empty array', async () => {
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
    describe('when valid polygon coordinates are provided', () => {
      it('AvoidZonesService.create when coordinates are valid should persist them as a JSON string and return the new zone', async () => {
        // Arrange
        const uid = 'user-oax-04';
        const coordinates = [
          [-96.73, 17.06],
          [-96.72, 17.06],
          [-96.72, 17.07],
          [-96.73, 17.07],
          [-96.73, 17.06],
        ];
        const mockAdd = jest.fn().mockResolvedValue({ id: 'zone-ef56gh78' });
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
        expect(result).toEqual({ id: 'zone-ef56gh78', coordinates });
      });
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    describe('when the avoid zone does not exist in Firestore', () => {
      it('AvoidZonesService.delete when the document does not exist should throw NotFoundException', async () => {
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
        await expect(service.delete(uid, 'zone-nonexistent')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('when the avoid zone belongs to a different user', () => {
      it('AvoidZonesService.delete when the stored uid does not match the requester should throw ForbiddenException', async () => {
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
        await expect(service.delete(uid, 'zone-ij90kl12')).rejects.toThrow(
          ForbiddenException,
        );
      });
    });

    describe('when the avoid zone belongs to the requester', () => {
      it('AvoidZonesService.delete when uid matches should call Firestore delete exactly once', async () => {
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
        await service.delete(uid, 'zone-mn34op56');

        // Assert
        expect(mockDelete).toHaveBeenCalledTimes(1);
      });
    });
  });
});
