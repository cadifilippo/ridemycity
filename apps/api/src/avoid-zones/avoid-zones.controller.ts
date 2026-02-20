import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';

interface AuthUser {
  uid: string;
}
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AvoidZonesService } from './avoid-zones.service';

@UseGuards(AuthGuard)
@Controller('avoid-zones')
export class AvoidZonesController {
  constructor(private readonly avoidZonesService: AvoidZonesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.avoidZonesService.findByUser(user.uid);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { coordinates: number[][] },
  ) {
    if (!Array.isArray(body?.coordinates) || body.coordinates.length < 4) {
      throw new BadRequestException(
        'coordinates must be an array of at least 4 points (closed polygon)',
      );
    }
    return this.avoidZonesService.create(user.uid, body.coordinates);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.avoidZonesService.delete(user.uid, id);
  }
}
