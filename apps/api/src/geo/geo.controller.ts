import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { GeoService } from './geo.service';

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
}
