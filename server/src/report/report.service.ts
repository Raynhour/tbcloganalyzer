import { Injectable, BadRequestException } from '@nestjs/common';
import { WarcraftLogsService } from '../warcraftlogs/warcraftlogs.service';
import { ConsumablesService } from '../consumables/consumables.service';

@Injectable()
export class ReportService {
  constructor(
    private readonly warcraftLogsService: WarcraftLogsService,
    private readonly consumablesService: ConsumablesService,
  ) {}

  extractReportCode(input: string): string {
    const trimmed = input.trim();
    const urlMatch = trimmed.match(
      /warcraftlogs\.com\/reports\/([A-Za-z0-9]+)/,
    );
    if (urlMatch) return urlMatch[1];

    if (/^[A-Za-z0-9]+$/.test(trimmed) && trimmed.length >= 8) {
      return trimmed;
    }

    throw new BadRequestException('Invalid report URL or code');
  }

  async getConsumableReport(
    reportCodeInput: string,
    fightId?: number,
    bossOnly?: boolean,
    hideWipes?: boolean,
  ) {
    const reportCode = this.extractReportCode(reportCodeInput);

    const report = await this.warcraftLogsService.fetchReportInfo(reportCode);

    const encounters = report.fights.map((f) => ({
      id: f.id,
      name: f.name,
      kill: f.kill,
      startTime: f.startTime,
      endTime: f.endTime,
      encounterId: f.encounterID,
    }));

    if (!report.fights.length) {
      return {
        reportTitle: report.title,
        encounters,
        players: [],
      };
    }

    if (fightId != null) {
      const fight = report.fights.find((f) => f.id === fightId);
      if (!fight) {
        return {
          reportTitle: report.title,
          encounters,
          players: [],
        };
      }

      const fightDuration = fight.endTime - fight.startTime;

      // Use WCL table API per player — gives complete buff data including pre-applied buffs
      const [playerTables, weaponEnchants] = await Promise.all([
        Promise.all(
          report.masterData.actors.map(async (actor) => {
            const [tableData, casts, deaths] = await Promise.all([
              this.warcraftLogsService.fetchPlayerBuffsTable(
                reportCode,
                fightId,
                actor.id,
              ),
              this.warcraftLogsService.fetchPlayerCastsTable(
                reportCode,
                fightId,
                actor.id,
              ),
              this.warcraftLogsService.fetchPlayerDeathsTable(
                reportCode,
                fightId,
                actor.id,
              ),
            ]);

            let aliveTime = tableData.totalTime;
            if (deaths.length > 0) {
              const deathTimestamp = deaths[0].timestamp;
              const deadTime = fight.endTime - deathTimestamp;
              aliveTime = Math.max(fightDuration - deadTime, 0);
            }

            return {
              actorId: actor.id,
              auras: tableData.auras,
              totalTime: aliveTime,
              casts,
            };
          }),
        ),
        this.warcraftLogsService.fetchSummaryTable(reportCode, fightId),
      ]);

      const players = this.consumablesService.processTableData(
        report.masterData.actors,
        playerTables,
        false,
        weaponEnchants,
      );

      return {
        reportTitle: report.title,
        encounters,
        players,
      };
    }

    // "All fights" mode — super-batch: 4 WCL requests total regardless of player count
    const targetFights = report.fights.filter((f) => {
      if (bossOnly && f.kill === null) return false;
      if (hideWipes && f.kill === false) return false;
      return true;
    });

    const targetFightIds = targetFights.map((f) => f.id);
    const fightMap = new Map(targetFights.map((f) => [f.id, f]));
    const actorIds = report.masterData.actors.map((a) => a.id);

    const [allBuffs, allCasts, allDeaths, perFightWeaponEnchants] = await Promise.all([
      this.warcraftLogsService.fetchAllPlayersFightBuffsTables(reportCode, targetFightIds, actorIds),
      this.warcraftLogsService.fetchAllPlayersFightCastsTables(reportCode, targetFightIds, actorIds),
      this.warcraftLogsService.fetchAllPlayersFightDeathsTables(reportCode, targetFightIds, actorIds),
      this.warcraftLogsService.fetchPerFightSummaryTables(reportCode, targetFightIds),
    ]);

    const perPlayerData = report.masterData.actors.map((actor) => ({
      actorId: actor.id,
      buffsMap: allBuffs.get(actor.id)!,
      castsMap: allCasts.get(actor.id)!,
      deathsMap: allDeaths.get(actor.id)!,
    }));

    // Assemble into per-fight player tables
    const perFightPlayerTables = new Map<
      number,
      { actorId: number; auras: any[]; totalTime: number; casts: any[] }[]
    >();

    for (const fid of targetFightIds) {
      const fight = fightMap.get(fid)!;
      const tables = perPlayerData.map((pd) => {
        const buffs = pd.buffsMap.get(fid) ?? { auras: [], totalTime: 0 };
        const casts = pd.castsMap.get(fid) ?? [];
        const deaths = pd.deathsMap.get(fid) ?? [];

        let aliveTime = buffs.totalTime;
        if (deaths.length > 0) {
          const deadTime = fight.endTime - deaths[0].timestamp;
          aliveTime = Math.max(buffs.totalTime - deadTime, 0);
        }

        return {
          actorId: pd.actorId,
          auras: buffs.auras,
          totalTime: aliveTime,
          casts,
        };
      });
      perFightPlayerTables.set(fid, tables);
    }

    const players = this.consumablesService.processTableDataWithBreakdown(
      report.masterData.actors,
      targetFights,
      perFightPlayerTables,
      perFightWeaponEnchants,
    );

    return {
      reportTitle: report.title,
      encounters,
      players,
    };
  }

  async getPlayerFightBuffs(
    reportCodeInput: string,
    fightId: number,
    playerName: string,
  ) {
    const reportCode = this.extractReportCode(reportCodeInput);
    const report = await this.warcraftLogsService.fetchReportInfo(reportCode);

    const actor = report.masterData.actors.find((a) => a.name === playerName);
    if (!actor) {
      return { playerName, auras: [] };
    }

    const tableData = await this.warcraftLogsService.fetchPlayerBuffsTable(
      reportCode,
      fightId,
      actor.id,
    );

    return {
      playerName,
      auras: tableData.auras.map((a) => ({
        ability: a.guid,
        name: a.name,
        source: 0,
        icon: '',
      })),
    };
  }

  async getPlayerFightRawData(
    reportCodeInput: string,
    fightId: number,
    playerName: string,
  ) {
    const reportCode = this.extractReportCode(reportCodeInput);
    const report = await this.warcraftLogsService.fetchReportInfo(reportCode);

    const actor = report.masterData.actors.find((a) => a.name === playerName);
    if (!actor) {
      return { playerName, auras: [], casts: [], enchants: [] };
    }

    const [tableData, casts, enchantMap] = await Promise.all([
      this.warcraftLogsService.fetchPlayerBuffsTable(reportCode, fightId, actor.id),
      this.warcraftLogsService.fetchPlayerCastsTable(reportCode, fightId, actor.id),
      this.warcraftLogsService.fetchSummaryTable(reportCode, fightId),
    ]);

    return {
      playerName,
      auras: tableData.auras.map((a) => ({
        guid: a.guid,
        name: a.name,
        totalUptime: a.totalUptime,
        totalUses: a.totalUses,
      })),
      casts: casts.map((c) => ({
        abilityGameID: c.abilityGameID,
        total: c.total,
      })),
      enchants: enchantMap.get(actor.id) ?? [],
    };
  }

  async getPlayerFightCasts(
    reportCodeInput: string,
    fightId: number,
    playerName: string,
  ) {
    const reportCode = this.extractReportCode(reportCodeInput);
    const report = await this.warcraftLogsService.fetchReportInfo(reportCode);

    const actor = report.masterData.actors.find((a) => a.name === playerName);
    if (!actor) {
      return { playerName, casts: [] };
    }

    const casts = await this.warcraftLogsService.fetchPlayerCastsTable(
      reportCode,
      fightId,
      actor.id,
    );

    return {
      playerName,
      casts: casts.map((c) => ({
        ability: c.abilityGameID,
        total: c.total,
      })),
    };
  }
}
