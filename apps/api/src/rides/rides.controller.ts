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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RidesService } from './rides.service';

interface AuthUser {
  uid: string;
}

@UseGuards(AuthGuard)
@Controller('rides')
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.ridesService.findByUser(user.uid);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: { coordinates: number[][] },
  ) {
    if (!Array.isArray(body?.coordinates) || body.coordinates.length < 2) {
      throw new BadRequestException(
        'coordinates must be an array of at least 2 points',
      );
    }
    return this.ridesService.create(user.uid, body.coordinates);
  }

  @Delete(':id')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ridesService.delete(user.uid, id);
  }
}
