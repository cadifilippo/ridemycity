import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RidesController } from './rides.controller';
import { RidesService, type StoredRide } from './rides.service';

describe('RidesController', () => {
  let controller: RidesController;
  let ridesService: jest.Mocked<RidesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RidesController],
      providers: [
        {
          provide: RidesService,
          useValue: {
            findByUser: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RidesController>(RidesController);
    ridesService = module.get(RidesService);
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    describe('when the user is authenticated', () => {
      it('RidesController.findAll when called with a valid user should delegate to RidesService.findByUser and return the result', async () => {
        // Arrange
        const user = { uid: 'user-cdmx-01' };
        const rides: StoredRide[] = [
          {
            id: 'ride-ab12cd34',
            coordinates: [
              [-99.1332, 19.4326],
              [-99.14, 19.438],
            ],
          },
        ];
        ridesService.findByUser.mockResolvedValueOnce(rides);

        // Act
        const result = await controller.findAll(user);

        // Assert
        expect(ridesService.findByUser).toHaveBeenCalledWith(user.uid);
        expect(result).toEqual(rides);
      });
    });
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    describe('when coordinates with at least 2 points are provided', () => {
      it('RidesController.create when coordinates has exactly 2 points should delegate to RidesService.create and return the created ride', async () => {
        // Arrange
        const user = { uid: 'user-gdl-02' };
        const coordinates = [
          [-103.3496, 20.6597],
          [-103.36, 20.665],
        ];
        const createdRide: StoredRide = { id: 'ride-ef56gh78', coordinates };
        ridesService.create.mockResolvedValueOnce(createdRide);

        // Act
        const result = await controller.create(user, { coordinates });

        // Assert
        expect(ridesService.create).toHaveBeenCalledWith(user.uid, coordinates);
        expect(result).toEqual(createdRide);
      });
    });

    describe('when coordinates has fewer than 2 points', () => {
      it('RidesController.create when coordinates has only 1 point should throw BadRequestException without calling RidesService', () => {
        // Arrange
        const user = { uid: 'user-mty-03' };

        // Act & Assert
        expect(() =>
          controller.create(user, { coordinates: [[-100.3161, 25.6866]] }),
        ).toThrow(BadRequestException);
        expect(ridesService.create).not.toHaveBeenCalled();
      });

      it('RidesController.create when coordinates is an empty array should throw BadRequestException without calling RidesService', () => {
        // Arrange
        const user = { uid: 'user-oax-04' };

        // Act & Assert
        expect(() =>
          controller.create(user, { coordinates: [] }),
        ).toThrow(BadRequestException);
        expect(ridesService.create).not.toHaveBeenCalled();
      });
    });

    describe('when coordinates is missing from the body', () => {
      it('RidesController.create when body has no coordinates field should throw BadRequestException without calling RidesService', () => {
        // Arrange
        const user = { uid: 'user-pue-05' };

        // Act & Assert
        expect(() =>
          controller.create(user, {} as { coordinates: number[][] }),
        ).toThrow(BadRequestException);
        expect(ridesService.create).not.toHaveBeenCalled();
      });
    });
  });

  // ── delete ─────────────────────────────────────────────────────────────────

  describe('delete', () => {
    describe('when a valid user and ride id are provided', () => {
      it('RidesController.delete when called with a valid user and id should delegate to RidesService.delete', async () => {
        // Arrange
        const user = { uid: 'user-slp-06' };
        const rideId = 'ride-mn34op56';
        ridesService.delete.mockResolvedValueOnce(undefined);

        // Act
        await controller.delete(user, rideId);

        // Assert
        expect(ridesService.delete).toHaveBeenCalledWith(user.uid, rideId);
      });
    });
  });
});
