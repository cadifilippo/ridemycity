import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AvoidZonesController } from './avoid-zones.controller';
import { AvoidZonesService } from './avoid-zones.service';

@Module({
  imports: [AuthModule],
  controllers: [AvoidZonesController],
  providers: [AvoidZonesService],
})
export class AvoidZonesModule {}
