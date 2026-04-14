import { Module } from '@nestjs/common';
import { ReportResolver } from './report.resolver';
import { ReportService } from './report.service';
import { ConsumablesService } from '../consumables/consumables.service';
import { WarcraftLogsModule } from '../warcraftlogs/warcraftlogs.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [WarcraftLogsModule, CacheModule],
  providers: [ReportResolver, ReportService, ConsumablesService],
})
export class ReportModule {}
