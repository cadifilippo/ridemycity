import { Controller, Get, Header } from '@nestjs/common';
import { AppService, type HealthcheckResult } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getHome(): string {
    return this.appService.getHome();
  }

  @Get('healthcheck')
  getHealthcheck(): HealthcheckResult {
    return this.appService.getHealthcheck();
  }
}
