import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AvoidZonesController } from './avoid-zones.controller';
import { AvoidZonesService, type StoredAvoidZone } from './avoid-zones.service';

describe('AvoidZonesController', () => {
  let controller: AvoidZonesController;
  let avoidZonesService: jest.Mocked<AvoidZonesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvoidZonesController],
      providers: [
        {
          provide: AvoidZonesService,
          useValue: {
            findByUser: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AvoidZonesController>(AvoidZonesController);
    avoidZonesService = module.get(AvoidZonesService);
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    describe('when the user is authenticated', () => {
      it('AvoidZonesController.findAll when called with a valid user should delegate to AvoidZonesService.findByUser and return the result', async () => {
        // Arrange
        const user = { uid: 'user-cdmx-01' };
        const zones: StoredAvoidZone[] = [
          {
            id: 'zone-ab12cd34',
            coordinates: [
              [-99.15, 19.44],
              [-99.13, 19.44],
              [-99.13, 19.45],
              [-99.15, 19.45],
              [-99.15, 19.44],
            ],
          },
        ];
        avoidZonesService.findByUser.mockResolvedValueOnce(zones);

        // Act
        const result = await controller.findAll(user);

        // Assert
        expect(avoidZonesService.findByUser).toHaveBeenCalledWith(user.uid);
        expect(result).toEqual(zones);
      });
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    describe('when a closed polygon with at least 4 points is provided', () => {
      it('AvoidZonesController.create when coordinates has exactly 4 points should delegate to AvoidZonesService.create and return the created zone', async () => {
        // Arrange
        const user = { uid: 'user-gdl-02' };
        const coordinates = [
          [-103.35, 20.65],
          [-103.33, 20.65],
          [-103.33, 20.67],
          [-103.35, 20.67],
        ];
        const createdZone: StoredAvoidZone = { id: 'zone-ef56gh78', coordinates };
        avoidZonesService.create.mockResolvedValueOnce(createdZone);

        // Act
        const result = await controller.create(user, { coordinates });

        // Assert
        expect(avoidZonesService.create).toHaveBeenCalledWith(user.uid, coordinates);
        expect(result).toEqual(createdZone);
      });
    });

    describe('when coordinates has fewer than 4 points', () => {
      it('AvoidZonesController.create when coordinates has only 3 points should throw BadRequestException without calling AvoidZonesService', () => {
        // Arrange
        const user = { uid: 'user-mty-03' };

        // Act & Assert
        expect(() =>
          controller.create(user, {
            coordinates: [
              [-100.32, 25.69],
              [-100.3, 25.69],
              [-100.3, 25.71],
            ],
          }),
        ).toThrow(BadRequestException);
        expect(avoidZonesService.create).not.toHaveBeenCalled();
      });

      it('AvoidZonesController.create when coordinates is an empty array should throw BadRequestException without calling AvoidZonesService', () => {
        // Arrange
        const user = { uid: 'user-oax-04' };

        // Act & Assert
        expect(() =>
          controller.create(user, { coordinates: [] }),
        ).toThrow(BadRequestException);
        expect(avoidZonesService.create).not.toHaveBeenCalled();
      });
    });

    describe('when coordinates is missing from the body', () => {
      it('AvoidZonesController.create when body has no coordinates field should throw BadRequestException without calling AvoidZonesService', () => {
        // Arrange
        const user = { uid: 'user-pue-05' };

        // Act & Assert
        expect(() =>
          controller.create(user, {} as { coordinates: number[][] }),
        ).toThrow(BadRequestException);
        expect(avoidZonesService.create).not.toHaveBeenCalled();
      });
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    describe('when a valid user and zone id are provided', () => {
      it('AvoidZonesController.delete when called with a valid user and id should delegate to AvoidZonesService.delete', async () => {
        // Arrange
        const user = { uid: 'user-slp-06' };
        const zoneId = 'zone-mn34op56';
        avoidZonesService.delete.mockResolvedValueOnce(undefined);

        // Act
        await controller.delete(user, zoneId);

        // Assert
        expect(avoidZonesService.delete).toHaveBeenCalledWith(user.uid, zoneId);
      });
    });
  });
});
