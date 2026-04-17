import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { ReportService } from './report.service';
import { CacheService } from '../cache/cache.service';
import {
  ConsumableReport,
  PlayerFightBuffs,
  PlayerFightCasts,
  PlayerFightRawData,
} from './report.model';

@Resolver()
export class ReportResolver {
  constructor(
    private readonly reportService: ReportService,
    private readonly cacheService: CacheService,
  ) {}

  @Mutation(() => Int)
  clearReportCache(@Args('reportCode') reportCode: string): number {
    return this.cacheService.deleteByTag(reportCode);
  }

  @Query(() => ConsumableReport)
  async reportConsumables(
    @Args('reportCode') reportCode: string,
    @Args('fightId', { type: () => Int, nullable: true }) fightId?: number,
    @Args('bossOnly', { type: () => Boolean, nullable: true }) bossOnly?: boolean,
    @Args('hideWipes', { type: () => Boolean, nullable: true }) hideWipes?: boolean,
  ): Promise<ConsumableReport> {
    return this.reportService.getConsumableReport(
      reportCode,
      fightId,
      bossOnly,
      hideWipes,
    );
  }

  @Query(() => PlayerFightBuffs)
  async playerFightBuffs(
    @Args('reportCode') reportCode: string,
    @Args('fightId', { type: () => Int }) fightId: number,
    @Args('playerName') playerName: string,
  ): Promise<PlayerFightBuffs> {
    return this.reportService.getPlayerFightBuffs(
      reportCode,
      fightId,
      playerName,
    );
  }

  @Query(() => PlayerFightRawData)
  async playerFightRawData(
    @Args('reportCode') reportCode: string,
    @Args('fightId', { type: () => Int }) fightId: number,
    @Args('playerName') playerName: string,
  ): Promise<PlayerFightRawData> {
    return this.reportService.getPlayerFightRawData(
      reportCode,
      fightId,
      playerName,
    );
  }

  @Query(() => PlayerFightCasts)
  async playerFightCasts(
    @Args('reportCode') reportCode: string,
    @Args('fightId', { type: () => Int }) fightId: number,
    @Args('playerName') playerName: string,
  ): Promise<PlayerFightCasts> {
    return this.reportService.getPlayerFightCasts(
      reportCode,
      fightId,
      playerName,
    );
  }
}
