import { ConfigService } from '@nestjs/config';
import { WarcraftLogsService } from './warcraftlogs.service';
import { CacheService } from '../cache/cache.service';
import axios from 'axios';

jest.mock('axios');
jest.mock('graphql-request', () => {
  const mockRequest = jest.fn();
  const mockSetHeader = jest.fn();
  return {
    GraphQLClient: jest.fn().mockImplementation(() => ({
      request: mockRequest,
      setHeader: mockSetHeader,
    })),
    gql: (strings: TemplateStringsArray) => strings.join(''),
    __mockRequest: mockRequest,
    __mockSetHeader: mockSetHeader,
  };
});

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WarcraftLogsService', () => {
  let service: WarcraftLogsService;
  let configService: jest.Mocked<ConfigService>;
  let cacheService: jest.Mocked<CacheService>;
  let mockRequest: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'CLIENT_ID') return 'test-id';
        if (key === 'CLIENT_SECRET') return 'test-secret';
        return undefined;
      }),
    } as any;

    cacheService = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
    } as any;

    service = new WarcraftLogsService(configService, cacheService);

    // Access the mocked request function
    const graphqlRequest = require('graphql-request');
    mockRequest = graphqlRequest.__mockRequest;
  });

  describe('getAccessToken', () => {
    it('should fetch a new token', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'test-token', expires_in: 3600 },
      });

      const token = await service.getAccessToken();

      expect(token).toBe('test-token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://www.warcraftlogs.com/oauth/token',
        'grant_type=client_credentials',
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          auth: { username: 'test-id', password: 'test-secret' },
        },
      );
    });

    it('should cache the token on subsequent calls', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'test-token', expires_in: 3600 },
      });

      await service.getAccessToken();
      const token2 = await service.getAccessToken();

      expect(token2).toBe('test-token');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchReportInfo', () => {
    it('should query WCL API with report code', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'test-token', expires_in: 3600 },
      });

      const mockReport = {
        reportData: {
          report: {
            title: 'Test Raid',
            fights: [{ id: 1, name: 'Boss', startTime: 0, endTime: 100 }],
            masterData: {
              actors: [{ id: 1, name: 'Player1', subType: 'Warrior' }],
            },
          },
        },
      };
      mockRequest.mockResolvedValue(mockReport);

      const result = await service.fetchReportInfo('ABC123');

      expect(result.title).toBe('Test Raid');
      expect(result.fights).toHaveLength(1);
    });
  });

  describe('fetchAllEvents', () => {
    beforeEach(() => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'test-token', expires_in: 3600 },
      });
    });

    it('should fetch all events in a single page', async () => {
      mockRequest.mockResolvedValue({
        reportData: {
          report: {
            events: {
              data: [
                {
                  timestamp: 50,
                  type: 'applybuff',
                  sourceID: 1,
                  abilityGameID: 28507,
                },
              ],
              nextPageTimestamp: null,
            },
          },
        },
      });

      const events = await service.fetchAllEvents('ABC123', 0, 100);
      expect(events).toHaveLength(1);
      expect(events[0].abilityGameID).toBe(28507);
    });

    it('should paginate through multiple pages', async () => {
      mockRequest
        .mockResolvedValueOnce({
          reportData: {
            report: {
              events: {
                data: [
                  {
                    timestamp: 50,
                    type: 'applybuff',
                    sourceID: 1,
                    abilityGameID: 28507,
                  },
                ],
                nextPageTimestamp: 100,
              },
            },
          },
        })
        .mockResolvedValueOnce({
          reportData: {
            report: {
              events: {
                data: [
                  {
                    timestamp: 150,
                    type: 'applybuff',
                    sourceID: 2,
                    abilityGameID: 28508,
                  },
                ],
                nextPageTimestamp: null,
              },
            },
          },
        });

      const events = await service.fetchAllEvents('ABC123', 0, 200);
      expect(events).toHaveLength(2);
    });
  });
});
