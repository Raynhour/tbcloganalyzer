import { Module } from '@nestjs/common';
import { CacheModule } from '../cache/cache.module';
import { WarcraftLogsService } from './warcraftlogs.service';

@Module({
  imports: [CacheModule],
  providers: [WarcraftLogsService],
  exports: [WarcraftLogsService],
})
export class WarcraftLogsModule {}
