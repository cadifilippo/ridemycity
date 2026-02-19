import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHome', () => {
    describe('when called', () => {
      it('AppController.getHome when called should return an HTML page containing the bike runner game canvas', () => {
        const result = appController.getHome();

        expect(result).toContain('<!doctype html>');
        expect(result).toContain('<canvas id="game"');
        expect(result).toContain('RideMyCity Runner');
      });
    });
  });

  describe('getHealthcheck', () => {
    describe('when the server is running', () => {
      it('AppController.getHealthcheck when called should return status ok with a positive uptime and a valid ISO timestamp', () => {
        // Arrange
        const before = Date.now();

        // Act
        const result = appController.getHealthcheck();

        // Assert
        expect(result.status).toBe('ok');
        expect(result.uptime).toBeGreaterThan(0);
        expect(new Date(result.timestamp).getTime()).toBeGreaterThanOrEqual(
          before,
        );
        expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
      });
    });
  });
});
