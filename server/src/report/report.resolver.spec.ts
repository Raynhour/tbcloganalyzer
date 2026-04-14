import { ReportResolver } from './report.resolver';
import { ReportService } from './report.service';

describe('ReportResolver', () => {
  let resolver: ReportResolver;
  let reportService: jest.Mocked<ReportService>;

  beforeEach(() => {
    reportService = {
      getConsumableReport: jest.fn(),
    } as any;

    resolver = new ReportResolver(reportService);
  });

  it('should return consumable report', async () => {
    const mockReport = {
      reportTitle: 'Karazhan',
      encounters: [
        { id: 1, name: 'Attumen', kill: true, startTime: 0, endTime: 100 },
      ],
      players: [
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
              count: 2,
              uptimePercent: null,
            },
          ],
        },
      ],
    };

    reportService.getConsumableReport.mockResolvedValue(mockReport);

    const result = await resolver.reportConsumables('ABC123');

    expect(result).toEqual(mockReport);
    expect(reportService.getConsumableReport).toHaveBeenCalledWith(
      'ABC123',
      undefined,
      undefined,
    );
  });

  it('should pass fightId to service when provided', async () => {
    const mockReport = {
      reportTitle: 'Karazhan',
      encounters: [],
      players: [],
    };

    reportService.getConsumableReport.mockResolvedValue(mockReport);

    const result = await resolver.reportConsumables('ABC123', 5);

    expect(result).toEqual(mockReport);
    expect(reportService.getConsumableReport).toHaveBeenCalledWith(
      'ABC123',
      5,
      undefined,
    );
  });
});
