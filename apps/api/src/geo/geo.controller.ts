import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GeoService } from './geo.service';
import { AuthGuard } from '../auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('geocode')
  geocode(@Query('q') q: string) {
    if (!q?.trim()) {
      throw new BadRequestException('Query parameter "q" is required');
    }
    return this.geoService.geocode(q.trim());
  }

  @Get('boundary')
  async boundary(@Query('q') q: string) {
    if (!q?.trim()) {
      throw new BadRequestException('Query parameter "q" is required');
    }
    const result = await this.geoService.getBoundary(q.trim());
    if (!result) {
      throw new NotFoundException('No boundary found for the given query');
    }
    return result;
  }
}
