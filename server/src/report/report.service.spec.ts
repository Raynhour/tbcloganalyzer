import { BadRequestException } from '@nestjs/common';
import { ReportService } from './report.service';
import { WarcraftLogsService } from '../warcraftlogs/warcraftlogs.service';
import { ConsumablesService } from '../consumables/consumables.service';

describe('ReportService', () => {
  let service: ReportService;
  let warcraftLogsService: jest.Mocked<WarcraftLogsService>;
  let consumablesService: jest.Mocked<ConsumablesService>;

  beforeEach(() => {
    warcraftLogsService = {
      fetchReportInfo: jest.fn(),
      fetchAllEvents: jest.fn(),
      fetchAllCastEvents: jest.fn().mockResolvedValue([]),
      fetchCombatantInfo: jest.fn().mockResolvedValue([]),
      fetchPlayerBuffsTable: jest
        .fn()
        .mockResolvedValue({ auras: [], totalTime: 0 }),
      fetchPlayerCastsTable: jest.fn().mockResolvedValue([]),
      fetchPlayerDeathsTable: jest.fn().mockResolvedValue([]),
      fetchPerFightBuffsTables: jest.fn().mockResolvedValue(new Map()),
      fetchPerFightCastsTables: jest.fn().mockResolvedValue(new Map()),
      fetchPerFightDeathsTables: jest.fn().mockResolvedValue(new Map()),
    } as any;

    consumablesService = {
      processEvents: jest.fn(),
      processTableData: jest.fn().mockReturnValue([]),
      processTableDataWithBreakdown: jest.fn().mockReturnValue([]),
    } as any;

    service = new ReportService(warcraftLogsService, consumablesService);
  });

  describe('extractReportCode', () => {
    it('should extract code from full URL', () => {
      expect(
        service.extractReportCode(
          'https://www.warcraftlogs.com/reports/ABC12345',
        ),
      ).toBe('ABC12345');
    });

    it('should extract code from URL with trailing path', () => {
      expect(
        service.extractReportCode(
          'https://www.warcraftlogs.com/reports/ABC12345#fight=1',
        ),
      ).toBe('ABC12345');
    });

    it('should accept raw report code', () => {
      expect(service.extractReportCode('ABC12345')).toBe('ABC12345');
    });

    it('should trim whitespace', () => {
      expect(service.extractReportCode('  ABC12345  ')).toBe('ABC12345');
    });

    it('should throw on invalid input', () => {
      expect(() => service.extractReportCode('abc')).toThrow(
        BadRequestException,
      );
    });

    it('should throw on empty input', () => {
      expect(() => service.extractReportCode('')).toThrow(BadRequestException);
    });
  });

  describe('getConsumableReport', () => {
    it('should return empty players for report with no fights', async () => {
      warcraftLogsService.fetchReportInfo.mockResolvedValue({
        title: 'Empty Raid',
        fights: [],
        masterData: { actors: [] },
      });

      const result = await service.getConsumableReport(
        'https://www.warcraftlogs.com/reports/ABCD1234',
      );

      expect(result.reportTitle).toBe('Empty Raid');
      expect(result.encounters).toEqual([]);
      expect(result.players).toEqual([]);
      expect(warcraftLogsService.fetchAllEvents).not.toHaveBeenCalled();
    });

    it('should use table-based approach for all fights with all fight IDs', async () => {
      const mockActors = [
        { id: 1, name: 'Test', subType: 'Warrior', icon: 'Warrior-Arms' },
      ];
      warcraftLogsService.fetchReportInfo.mockResolvedValue({
        title: 'Karazhan',
        fights: [
          { id: 1, name: 'Attumen', kill: true, startTime: 0, endTime: 100 },
          { id: 2, name: 'Moroes', kill: true, startTime: 200, endTime: 400 },
        ],
        masterData: { actors: mockActors },
      });

      const mockPlayers = [
        {
          playerName: 'Test',
          class: 'Warrior',
          spec: 'Arms',
          consumables: [
            {
              name: 'Haste Potion',
              category: 'potion',
              icon: 'inv_potion_108',
              spellId: 28507,
              count: 1,
              uptimePercent: null,
            },
          ],
        },
      ];
      consumablesService.processTableDataWithBreakdown.mockReturnValue(
        mockPlayers,
      );

      const result = await service.getConsumableReport('ABCD1234');

      expect(result.reportTitle).toBe('Karazhan');
      expect(result.encounters).toEqual([
        { id: 1, name: 'Attumen', kill: true, startTime: 0, endTime: 100 },
        { id: 2, name: 'Moroes', kill: true, startTime: 200, endTime: 400 },
      ]);
      expect(result.players).toEqual(mockPlayers);
      // Uses batched per-fight queries
      expect(warcraftLogsService.fetchPerFightBuffsTables).toHaveBeenCalledWith(
        'ABCD1234',
        [1, 2],
        1,
      );
      expect(warcraftLogsService.fetchPerFightCastsTables).toHaveBeenCalledWith(
        'ABCD1234',
        [1, 2],
        1,
      );
      expect(
        warcraftLogsService.fetchPerFightDeathsTables,
      ).toHaveBeenCalledWith('ABCD1234', [1, 2], 1);
      expect(
        consumablesService.processTableDataWithBreakdown,
      ).toHaveBeenCalled();
    });

    it('should use table-based approach with buffs and casts when fightId provided', async () => {
      const mockActors = [
        { id: 1, name: 'Test', subType: 'Warrior', icon: 'Warrior-Arms' },
      ];
      warcraftLogsService.fetchReportInfo.mockResolvedValue({
        title: 'Karazhan',
        fights: [
          { id: 1, name: 'Attumen', kill: true, startTime: 0, endTime: 100 },
          { id: 2, name: 'Moroes', kill: true, startTime: 200, endTime: 400 },
        ],
        masterData: { actors: mockActors },
      });

      warcraftLogsService.fetchPlayerBuffsTable.mockResolvedValue({
        auras: [
          {
            guid: 28540,
            name: 'Flask of Pure Death',
            type: 1,
            totalUptime: 200,
            totalUses: 1,
          },
        ],
        totalTime: 200,
      });
      warcraftLogsService.fetchPlayerCastsTable.mockResolvedValue([
        { abilityGameID: 28499, total: 1 },
      ]);
      consumablesService.processTableData.mockReturnValue([]);

      const result = await service.getConsumableReport('ABCD1234', 2);

      expect(result.encounters).toHaveLength(2);
      expect(warcraftLogsService.fetchPlayerBuffsTable).toHaveBeenCalledWith(
        'ABCD1234',
        2,
        1,
      );
      expect(warcraftLogsService.fetchPlayerCastsTable).toHaveBeenCalledWith(
        'ABCD1234',
        2,
        1,
      );
      expect(consumablesService.processTableData).toHaveBeenCalled();
    });

    it('should return empty players for non-existent fightId', async () => {
      warcraftLogsService.fetchReportInfo.mockResolvedValue({
        title: 'Karazhan',
        fights: [
          { id: 1, name: 'Attumen', kill: true, startTime: 0, endTime: 100 },
        ],
        masterData: { actors: [] },
      });

      const result = await service.getConsumableReport('ABCD1234', 999);

      expect(result.players).toEqual([]);
      expect(result.encounters).toHaveLength(1);
    });
  });
});
