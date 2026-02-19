import { Injectable } from '@nestjs/common';
import { HOME_GAME_PAGE_HTML } from './home-game.page';

export interface HealthcheckResult {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

@Injectable()
export class AppService {
  getHome(): string {
    return HOME_GAME_PAGE_HTML;
  }

  getHealthcheck(): HealthcheckResult {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
