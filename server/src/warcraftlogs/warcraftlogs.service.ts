import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHash } from 'crypto';
import { GraphQLClient, gql } from 'graphql-request';
import { CacheService } from '../cache/cache.service';
import {
  CONSUMABLE_SPELL_IDS,
  CAST_ONLY_SPELL_IDS,
  WEAPON_ENCHANT_TO_SPELL_ID,
  WEAPON_SLOTS,
} from '../consumables/consumables.constants';

interface TokenData {
  accessToken: string;
  expiresAt: number;
}

interface WclFight {
  id: number;
  name: string;
  kill: boolean | null;
  startTime: number;
  endTime: number;
  encounterID: number;
}

interface WclActor {
  id: number;
  name: string;
  subType: string;
  icon: string;
}

interface WclEventsResponse {
  data: Array<{
    timestamp: number;
    type: string;
    sourceID: number;
    targetID: number;
    abilityGameID: number;
  }>;
  nextPageTimestamp: number | null;
}

interface WclReportResponse {
  reportData: {
    report: {
      title: string;
      fights: WclFight[];
      masterData: {
        actors: WclActor[];
      };
    };
  };
}

interface WclEventsQueryResponse {
  reportData: {
    report: {
      events: WclEventsResponse;
    };
  };
}

export interface WclAura {
  source: number;
  ability: number;
  stacks: number;
  icon: string;
  name: string;
}

export interface WclCombatantInfo {
  sourceID: number;
  auras: WclAura[];
}

interface WclCombatantInfoResponse {
  reportData: {
    report: {
      events: {
        data: WclCombatantInfo[];
      };
    };
  };
}

const REPORT_INFO_QUERY = gql`
  query ReportInfo($code: String!) {
    reportData {
      report(code: $code) {
        title
        fights {
          id
          name
          kill
          startTime
          endTime
          encounterID
        }
        masterData {
          actors(type: "Player") {
            id
            name
            subType
            icon
          }
        }
      }
    }
  }
`;

const COMBATANT_INFO_QUERY = gql`
  query ReportCombatantInfo(
    $code: String!
    $startTime: Float!
    $endTime: Float!
  ) {
    reportData {
      report(code: $code) {
        events(
          dataType: CombatantInfo
          startTime: $startTime
          endTime: $endTime
          limit: 10000
        ) {
          data
        }
      }
    }
  }
`;

const PLAYER_DEATHS_TABLE_QUERY = gql`
  query ReportPlayerDeaths(
    $code: String!
    $fightIDs: [Int!]!
    $sourceID: Int!
  ) {
    reportData {
      report(code: $code) {
        table(dataType: Deaths, fightIDs: $fightIDs, sourceID: $sourceID)
      }
    }
  }
`;

interface WclDeathEntry {
  timestamp: number;
  fight: number;
}

interface WclDeathsTableResponse {
  reportData: {
    report: {
      table: {
        data: {
          entries: WclDeathEntry[];
        };
      };
    };
  };
}

const PLAYER_BUFFS_TABLE_QUERY = gql`
  query ReportPlayerBuffs($code: String!, $fightIDs: [Int!]!, $sourceID: Int!) {
    reportData {
      report(code: $code) {
        table(dataType: Buffs, fightIDs: $fightIDs, sourceID: $sourceID)
      }
    }
  }
`;

interface WclTableResponse {
  reportData: {
    report: {
      table: {
        data: {
          auras: Array<{
            guid: number;
            name: string;
            type: number;
            totalUptime: number;
            totalUses: number;
          }>;
          totalTime: number;
        };
      };
    };
  };
}

interface WclCastsTableResponse {
  reportData: {
    report: {
      table: {
        data: {
          entries: Array<{
            guid: number;
            name: string;
            total: number;
          }>;
          totalTime: number;
        };
      };
    };
  };
}

interface WclGearItem {
  id: number;
  slot: number;
  temporaryEnchant?: number;
  temporaryEnchantName?: string;
}

interface WclPlayerDetail {
  id: number;
  name: string;
  combatantInfo?: {
    gear?: WclGearItem[];
  };
}

interface WclSummaryTableResponse {
  reportData: {
    report: {
      table: {
        data: {
          playerDetails?: {
            dps?: WclPlayerDetail[];
            healers?: WclPlayerDetail[];
            tanks?: WclPlayerDetail[];
          };
        };
      };
    };
  };
}

const SUMMARY_TABLE_QUERY = gql`
  query SummaryTable($code: String!, $fightIDs: [Int!]!) {
    reportData {
      report(code: $code) {
        table(fightIDs: $fightIDs)
      }
    }
  }
`;

const EVENTS_QUERY = gql`
  query ReportEvents(
    $code: String!
    $startTime: Float!
    $endTime: Float!
    $filterExpression: String!
  ) {
    reportData {
      report(code: $code) {
        events(
          dataType: Buffs
          startTime: $startTime
          endTime: $endTime
          limit: 10000
          filterExpression: $filterExpression
        ) {
          data
          nextPageTimestamp
        }
      }
    }
  }
`;

const CAST_EVENTS_QUERY = gql`
  query ReportCastEvents(
    $code: String!
    $startTime: Float!
    $endTime: Float!
    $filterExpression: String!
  ) {
    reportData {
      report(code: $code) {
        events(
          dataType: Casts
          startTime: $startTime
          endTime: $endTime
          limit: 10000
          filterExpression: $filterExpression
        ) {
          data
          nextPageTimestamp
        }
      }
    }
  }
`;

const PLAYER_CASTS_TABLE_QUERY = gql`
  query ReportPlayerCasts(
    $code: String!
    $fightIDs: [Int!]!
    $sourceID: Int!
    $filterExpression: String!
  ) {
    reportData {
      report(code: $code) {
        table(
          dataType: Casts
          fightIDs: $fightIDs
          sourceID: $sourceID
          filterExpression: $filterExpression
        )
      }
    }
  }
`;

@Injectable()
export class WarcraftLogsService {
  private readonly logger = new Logger(WarcraftLogsService.name);
  private tokenData: TokenData | null = null;
  private graphqlClient: GraphQLClient;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.graphqlClient = new GraphQLClient(
      'https://www.warcraftlogs.com/api/v2/client',
    );
  }

  private getCacheKey(
    query: string | ReturnType<typeof gql>,
    variables: Record<string, any>,
  ): string {
    const raw = JSON.stringify({ query: String(query), variables });
    return createHash('sha256').update(raw).digest('hex');
  }

  async getAccessToken(): Promise<string> {
    if (this.tokenData && Date.now() < this.tokenData.expiresAt - 60_000) {
      return this.tokenData.accessToken;
    }

    const clientId = this.configService.get<string>('CLIENT_ID');
    const clientSecret = this.configService.get<string>('CLIENT_SECRET');

    const response = await axios.post(
      'https://www.warcraftlogs.com/oauth/token',
      'grant_type=client_credentials',
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        auth: { username: clientId!, password: clientSecret! },
      },
    );

    this.tokenData = {
      accessToken: response.data.access_token,
      expiresAt: Date.now() + response.data.expires_in * 1000,
    };

    this.logger.log('Obtained new WCL access token');
    return this.tokenData.accessToken;
  }

  private async requestWithRetry<T>(
    query: string | ReturnType<typeof gql>,
    variables: Record<string, any>,
    maxRetries = 3,
  ): Promise<T> {
    const cacheKey = this.getCacheKey(query, variables);
    const cached = this.cacheService.get<T>(cacheKey);
    if (cached !== null) {
      this.logger.debug('Cache hit');
      return cached;
    }

    const token = await this.getAccessToken();
    this.graphqlClient.setHeader('Authorization', `Bearer ${token}`);

    const tag: string | undefined =
      typeof variables.code === 'string' ? variables.code : undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.graphqlClient.request<T>(query, variables);
        this.cacheService.set(cacheKey, result, tag);
        return result;
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 429) {
          if (attempt < maxRetries) {
            const retryAfter =
              parseInt(
                error?.response?.headers?.get?.('retry-after') ?? '',
                10,
              ) || (attempt + 1) * 10;
            this.logger.warn(
              `Rate limited (429). Retrying in ${retryAfter}s (attempt ${attempt + 1}/${maxRetries})`,
            );
            await new Promise((r) => setTimeout(r, retryAfter * 1000));
            continue;
          }
          throw new HttpException(
            'Warcraft Logs API rate limit exceeded. Please wait a moment and try again.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  async fetchReportInfo(reportCode: string) {
    const data = await this.requestWithRetry<WclReportResponse>(
      REPORT_INFO_QUERY,
      { code: reportCode },
    );
    return data.reportData.report;
  }

  async fetchCombatantInfo(
    reportCode: string,
    startTime: number,
    endTime: number,
  ): Promise<WclCombatantInfo[]> {
    const data = await this.requestWithRetry<WclCombatantInfoResponse>(
      COMBATANT_INFO_QUERY,
      { code: reportCode, startTime, endTime },
    );
    return data.reportData.report.events.data;
  }

  async fetchPlayerCastsTable(
    reportCode: string,
    fightIds: number | number[],
    sourceId: number,
  ): Promise<{ abilityGameID: number; total: number }[]> {
    const castOnlyIds = Array.from(CAST_ONLY_SPELL_IDS).join(',');
    const filterExpression = `ability.id IN (${castOnlyIds})`;

    const data = await this.requestWithRetry<WclCastsTableResponse>(
      PLAYER_CASTS_TABLE_QUERY,
      {
        code: reportCode,
        fightIDs: Array.isArray(fightIds) ? fightIds : [fightIds],
        sourceID: sourceId,
        filterExpression,
      },
    );

    const entries = data.reportData.report.table.data.entries ?? [];
    return entries.map((e) => ({ abilityGameID: e.guid, total: e.total }));
  }

  async fetchPlayerBuffsTable(
    reportCode: string,
    fightIds: number | number[],
    sourceId: number,
  ) {
    const data = await this.requestWithRetry<WclTableResponse>(
      PLAYER_BUFFS_TABLE_QUERY,
      {
        code: reportCode,
        fightIDs: Array.isArray(fightIds) ? fightIds : [fightIds],
        sourceID: sourceId,
      },
    );
    return data.reportData.report.table.data;
  }

  async fetchPlayerDeathsTable(
    reportCode: string,
    fightIds: number | number[],
    sourceId: number,
  ): Promise<WclDeathEntry[]> {
    const data = await this.requestWithRetry<WclDeathsTableResponse>(
      PLAYER_DEATHS_TABLE_QUERY,
      {
        code: reportCode,
        fightIDs: Array.isArray(fightIds) ? fightIds : [fightIds],
        sourceID: sourceId,
      },
    );
    return data.reportData.report.table.data.entries ?? [];
  }

  /**
   * Fetch buffs table for ALL players × ALL fights in a single GraphQL request via aliases.
   * Returns a Map of actorId -> Map of fightId -> { auras, totalTime }.
   */
  async fetchAllPlayersFightBuffsTables(
    reportCode: string,
    fightIds: number[],
    actorIds: number[],
  ): Promise<Map<number, Map<number, { auras: WclTableResponse['reportData']['report']['table']['data']['auras']; totalTime: number }>>> {
    const aliases = actorIds.flatMap((sourceId) =>
      fightIds.map(
        (fid) =>
          `p${sourceId}_f${fid}: table(dataType: Buffs, fightIDs: [${fid}], sourceID: ${sourceId})`,
      ),
    );
    const query = `query SuperBatchBuffs($code: String!) {
      reportData { report(code: $code) { ${aliases.join('\n')} } }
    }`;

    const data = await this.requestWithRetry<{
      reportData: { report: Record<string, { data: { auras: any[]; totalTime: number } }> };
    }>(query, { code: reportCode });

    const result = new Map<number, Map<number, { auras: any[]; totalTime: number }>>();
    for (const sourceId of actorIds) {
      const fightMap = new Map<number, { auras: any[]; totalTime: number }>();
      for (const fid of fightIds) {
        const tableData = data.reportData.report[`p${sourceId}_f${fid}`]?.data;
        fightMap.set(fid, tableData ?? { auras: [], totalTime: 0 });
      }
      result.set(sourceId, fightMap);
    }
    return result;
  }

  /**
   * Fetch casts table for ALL players × ALL fights in a single GraphQL request via aliases.
   * Returns a Map of actorId -> Map of fightId -> cast entries.
   */
  async fetchAllPlayersFightCastsTables(
    reportCode: string,
    fightIds: number[],
    actorIds: number[],
  ): Promise<Map<number, Map<number, { abilityGameID: number; total: number }[]>>> {
    const castOnlyIds = Array.from(CAST_ONLY_SPELL_IDS).join(',');
    const filterExpr = `ability.id IN (${castOnlyIds})`;

    const aliases = actorIds.flatMap((sourceId) =>
      fightIds.map(
        (fid) =>
          `p${sourceId}_f${fid}: table(dataType: Casts, fightIDs: [${fid}], sourceID: ${sourceId}, filterExpression: "${filterExpr}")`,
      ),
    );
    const query = `query SuperBatchCasts($code: String!) {
      reportData { report(code: $code) { ${aliases.join('\n')} } }
    }`;

    const data = await this.requestWithRetry<{
      reportData: { report: Record<string, { data: { entries: { guid: number; total: number }[] } }> };
    }>(query, { code: reportCode });

    const result = new Map<number, Map<number, { abilityGameID: number; total: number }[]>>();
    for (const sourceId of actorIds) {
      const fightMap = new Map<number, { abilityGameID: number; total: number }[]>();
      for (const fid of fightIds) {
        const entries = data.reportData.report[`p${sourceId}_f${fid}`]?.data?.entries ?? [];
        fightMap.set(fid, entries.map((e) => ({ abilityGameID: e.guid, total: e.total })));
      }
      result.set(sourceId, fightMap);
    }
    return result;
  }

  /**
   * Fetch deaths table for ALL players × ALL fights in a single GraphQL request via aliases.
   * Returns a Map of actorId -> Map of fightId -> death entries.
   */
  async fetchAllPlayersFightDeathsTables(
    reportCode: string,
    fightIds: number[],
    actorIds: number[],
  ): Promise<Map<number, Map<number, WclDeathEntry[]>>> {
    const aliases = actorIds.flatMap((sourceId) =>
      fightIds.map(
        (fid) =>
          `p${sourceId}_f${fid}: table(dataType: Deaths, fightIDs: [${fid}], sourceID: ${sourceId})`,
      ),
    );
    const query = `query SuperBatchDeaths($code: String!) {
      reportData { report(code: $code) { ${aliases.join('\n')} } }
    }`;

    const data = await this.requestWithRetry<{
      reportData: { report: Record<string, { data: { entries: WclDeathEntry[] } }> };
    }>(query, { code: reportCode });

    const result = new Map<number, Map<number, WclDeathEntry[]>>();
    for (const sourceId of actorIds) {
      const fightMap = new Map<number, WclDeathEntry[]>();
      for (const fid of fightIds) {
        const entries = data.reportData.report[`p${sourceId}_f${fid}`]?.data?.entries ?? [];
        fightMap.set(fid, entries);
      }
      result.set(sourceId, fightMap);
    }
    return result;
  }

  /**
   * Fetch buffs table for each fight individually, batched into a single GraphQL request via aliases.
   * Returns a Map of fightId -> { auras, totalTime }.
   */
  async fetchPerFightBuffsTables(
    reportCode: string,
    fightIds: number[],
    sourceId: number,
  ): Promise<
    Map<
      number,
      {
        auras: WclTableResponse['reportData']['report']['table']['data']['auras'];
        totalTime: number;
      }
    >
  > {
    const aliases = fightIds.map(
      (fid) =>
        `f${fid}: table(dataType: Buffs, fightIDs: [${fid}], sourceID: ${sourceId})`,
    );
    const query = `query BatchBuffs($code: String!) {
      reportData { report(code: $code) { ${aliases.join('\n')} } }
    }`;

    const data = await this.requestWithRetry<{
      reportData: {
        report: Record<string, { data: { auras: any[]; totalTime: number } }>;
      };
    }>(query, { code: reportCode });

    const result = new Map<number, { auras: any[]; totalTime: number }>();
    for (const fid of fightIds) {
      const tableData = data.reportData.report[`f${fid}`]?.data;
      result.set(fid, tableData ?? { auras: [], totalTime: 0 });
    }
    return result;
  }

  /**
   * Fetch casts table for each fight individually, batched into a single GraphQL request via aliases.
   */
  async fetchPerFightCastsTables(
    reportCode: string,
    fightIds: number[],
    sourceId: number,
  ): Promise<Map<number, { abilityGameID: number; total: number }[]>> {
    const castOnlyIds = Array.from(CAST_ONLY_SPELL_IDS).join(',');
    const filterExpr = `ability.id IN (${castOnlyIds})`;

    const aliases = fightIds.map(
      (fid) =>
        `f${fid}: table(dataType: Casts, fightIDs: [${fid}], sourceID: ${sourceId}, filterExpression: "${filterExpr}")`,
    );
    const query = `query BatchCasts($code: String!) {
      reportData { report(code: $code) { ${aliases.join('\n')} } }
    }`;

    const data = await this.requestWithRetry<{
      reportData: {
        report: Record<
          string,
          { data: { entries: { guid: number; total: number }[] } }
        >;
      };
    }>(query, { code: reportCode });

    const result = new Map<
      number,
      { abilityGameID: number; total: number }[]
    >();
    for (const fid of fightIds) {
      const entries = data.reportData.report[`f${fid}`]?.data?.entries ?? [];
      result.set(
        fid,
        entries.map((e) => ({ abilityGameID: e.guid, total: e.total })),
      );
    }
    return result;
  }

  /**
   * Fetch deaths table for each fight individually, batched into a single GraphQL request via aliases.
   */
  async fetchPerFightDeathsTables(
    reportCode: string,
    fightIds: number[],
    sourceId: number,
  ): Promise<Map<number, WclDeathEntry[]>> {
    const aliases = fightIds.map(
      (fid) =>
        `f${fid}: table(dataType: Deaths, fightIDs: [${fid}], sourceID: ${sourceId})`,
    );
    const query = `query BatchDeaths($code: String!) {
      reportData { report(code: $code) { ${aliases.join('\n')} } }
    }`;

    const data = await this.requestWithRetry<{
      reportData: {
        report: Record<string, { data: { entries: WclDeathEntry[] } }>;
      };
    }>(query, { code: reportCode });

    const result = new Map<number, WclDeathEntry[]>();
    for (const fid of fightIds) {
      const entries = data.reportData.report[`f${fid}`]?.data?.entries ?? [];
      result.set(fid, entries);
    }
    return result;
  }

  async fetchAllEvents(reportCode: string, startTime: number, endTime: number) {
    const spellIds = CONSUMABLE_SPELL_IDS.join(',');
    const filterExpression = `(type = "applybuff" OR type = "removebuff") AND ability.id IN (${spellIds})`;
    const allEvents: WclEventsResponse['data'] = [];
    let currentStartTime = startTime;

    while (currentStartTime < endTime) {
      const data = await this.requestWithRetry<WclEventsQueryResponse>(
        EVENTS_QUERY,
        {
          code: reportCode,
          startTime: currentStartTime,
          endTime,
          filterExpression,
        },
      );

      const events = data.reportData.report.events;
      allEvents.push(...events.data);

      if (events.nextPageTimestamp === null) break;
      currentStartTime = events.nextPageTimestamp;
    }

    return allEvents;
  }

  async fetchAllCastEvents(
    reportCode: string,
    startTime: number,
    endTime: number,
  ) {
    const castOnlyIds = Array.from(CAST_ONLY_SPELL_IDS).join(',');
    const filterExpression = `ability.id IN (${castOnlyIds})`;
    const allEvents: WclEventsResponse['data'] = [];
    let currentStartTime = startTime;

    while (currentStartTime < endTime) {
      const data = await this.requestWithRetry<WclEventsQueryResponse>(
        CAST_EVENTS_QUERY,
        {
          code: reportCode,
          startTime: currentStartTime,
          endTime,
          filterExpression,
        },
      );

      const events = data.reportData.report.events;
      allEvents.push(...events.data);

      if (events.nextPageTimestamp === null) break;
      currentStartTime = events.nextPageTimestamp;
    }

    return allEvents;
  }

  private extractEnchantMap(
    playerDetails: WclSummaryTableResponse['reportData']['report']['table']['data']['playerDetails'],
  ): Map<number, number[]> {
    const result = new Map<number, number[]>();
    const allPlayers = [
      ...(playerDetails?.dps ?? []),
      ...(playerDetails?.healers ?? []),
      ...(playerDetails?.tanks ?? []),
    ];
    for (const player of allPlayers) {
      const spellIds: number[] = [];
      for (const item of player.combatantInfo?.gear ?? []) {
        if (!WEAPON_SLOTS.has(item.slot)) continue;
        if (!item.temporaryEnchant) continue;
        const spellId = WEAPON_ENCHANT_TO_SPELL_ID.get(item.temporaryEnchant);
        if (spellId !== undefined) spellIds.push(spellId);
      }
      if (spellIds.length > 0) result.set(player.id, spellIds);
    }
    return result;
  }

  async fetchSummaryTable(
    reportCode: string,
    fightId: number,
  ): Promise<Map<number, number[]>> {
    const data = await this.requestWithRetry<WclSummaryTableResponse>(
      SUMMARY_TABLE_QUERY,
      { code: reportCode, fightIDs: [fightId] },
    );
    return this.extractEnchantMap(
      data.reportData.report.table.data.playerDetails,
    );
  }

  async fetchPerFightSummaryTables(
    reportCode: string,
    fightIds: number[],
  ): Promise<Map<number, Map<number, number[]>>> {
    const aliases = fightIds.map((fid) => `f${fid}: table(fightIDs: [${fid}])`);
    const query = `query BatchSummary($code: String!) {
      reportData { report(code: $code) { ${aliases.join('\n')} } }
    }`;

    type BatchSummaryResponse = {
      reportData: {
        report: Record<
          string,
          {
            data: {
              playerDetails?: WclSummaryTableResponse['reportData']['report']['table']['data']['playerDetails'];
            };
          }
        >;
      };
    };

    const data = await this.requestWithRetry<BatchSummaryResponse>(query, {
      code: reportCode,
    });

    const result = new Map<number, Map<number, number[]>>();
    for (const fid of fightIds) {
      const playerDetails =
        data.reportData.report[`f${fid}`]?.data?.playerDetails;
      result.set(fid, this.extractEnchantMap(playerDetails));
    }
    return result;
  }
}
