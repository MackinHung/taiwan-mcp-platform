import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  fetchEndpoint: vi.fn(),
  buildUrl: vi.fn(),
  getAccessToken: vi.fn(),
  resetTokenCache: vi.fn(),
}));

import { fetchEndpoint } from '../src/client.js';
import { searchTraTimetable } from '../src/tools/tra-timetable.js';
import { searchThsrTimetable } from '../src/tools/thsr-timetable.js';
import { getTraLiveboard } from '../src/tools/tra-liveboard.js';
import { getMetroInfo } from '../src/tools/metro.js';
import { getBusArrival } from '../src/tools/bus-arrival.js';
import type { Env } from '../src/types.js';

const mockFetchEndpoint = vi.mocked(fetchEndpoint);

const env: Env = {
  TDX_CLIENT_ID: 'test-id',
  TDX_CLIENT_SECRET: 'test-secret',
  SERVER_NAME: 'taiwan-transit',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchEndpoint.mockReset();
});

// --- TRA Timetable ---
describe('searchTraTimetable', () => {
  const sampleData = [
    {
      TrainDate: '2026-03-17',
      DailyTrainInfo: {
        TrainNo: '111',
        Direction: 0,
        TrainTypeName: { Zh_tw: '自強', En: 'Tze-Chiang' },
        StartingStationName: { Zh_tw: '台北', En: 'Taipei' },
        EndingStationName: { Zh_tw: '高雄', En: 'Kaohsiung' },
      },
      StopTimes: [
        { StopSequence: 1, StationName: { Zh_tw: '台北', En: 'Taipei' }, StationID: '1000', ArrivalTime: '08:00', DepartureTime: '08:05' },
        { StopSequence: 2, StationName: { Zh_tw: '新竹', En: 'Hsinchu' }, StationID: '3300', ArrivalTime: '09:30', DepartureTime: '09:32' },
      ],
    },
  ];

  it('returns formatted timetable data', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleData);
    const result = await searchTraTimetable(env, { origin: '1000', destination: '3300', date: '2026-03-17' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('111');
    expect(result.content[0].text).toContain('自強');
    expect(result.content[0].text).toContain('08:05');
    expect(result.content[0].text).toContain('09:30');
  });

  it('returns not-found when no trains available', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([]);
    const result = await searchTraTimetable(env, { origin: '1000', destination: '3300', date: '2026-03-17' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('returns error when origin/destination missing', async () => {
    const result = await searchTraTimetable(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('起站代碼');
  });

  it('handles API error gracefully', async () => {
    mockFetchEndpoint.mockRejectedValueOnce(new Error('TRA API down'));
    const result = await searchTraTimetable(env, { origin: '1000', destination: '3300' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('TRA API down');
  });
});

// --- THSR Timetable ---
describe('searchThsrTimetable', () => {
  const sampleData = [
    {
      TrainDate: '2026-03-17',
      DailyTrainInfo: {
        TrainNo: '0603',
        Direction: 0,
        StartingStationName: { Zh_tw: '南港', En: 'Nangang' },
        EndingStationName: { Zh_tw: '左營', En: 'Zuoying' },
      },
      StopTimes: [
        { StopSequence: 1, StationName: { Zh_tw: '台北', En: 'Taipei' }, StationID: '1000', ArrivalTime: '06:30', DepartureTime: '06:31' },
        { StopSequence: 2, StationName: { Zh_tw: '左營', En: 'Zuoying' }, StationID: '1100', ArrivalTime: '08:15', DepartureTime: '08:15' },
      ],
    },
  ];

  it('returns formatted THSR timetable', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleData);
    const result = await searchThsrTimetable(env, { origin: '1000', destination: '1100', date: '2026-03-17' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('0603');
    expect(result.content[0].text).toContain('06:31');
    expect(result.content[0].text).toContain('08:15');
  });

  it('returns not-found when no trains available', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([]);
    const result = await searchThsrTimetable(env, { origin: '1000', destination: '1100', date: '2026-03-17' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('returns error when origin/destination missing', async () => {
    const result = await searchThsrTimetable(env, { origin: '1000' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('起站代碼');
  });

  it('handles API error gracefully', async () => {
    mockFetchEndpoint.mockRejectedValueOnce(new Error('THSR timeout'));
    const result = await searchThsrTimetable(env, { origin: '1000', destination: '1100' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('THSR timeout');
  });
});

// --- TRA LiveBoard ---
describe('getTraLiveboard', () => {
  const sampleData = [
    {
      StationName: { Zh_tw: '台北', En: 'Taipei' },
      TrainNo: '123',
      Direction: 0,
      TrainTypeName: { Zh_tw: '自強', En: 'Tze-Chiang' },
      EndingStationName: { Zh_tw: '花蓮', En: 'Hualien' },
      ScheduledArrivalTime: '10:00',
      ScheduledDepartureTime: '10:05',
      DelayTime: 0,
    },
    {
      StationName: { Zh_tw: '台北', En: 'Taipei' },
      TrainNo: '456',
      Direction: 1,
      TrainTypeName: { Zh_tw: '莒光', En: 'Chu-Kuang' },
      EndingStationName: { Zh_tw: '基隆', En: 'Keelung' },
      ScheduledDepartureTime: '10:15',
      DelayTime: 5,
    },
  ];

  it('returns liveboard data for specific station', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleData);
    const result = await getTraLiveboard(env, { stationId: '1000' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北');
    expect(result.content[0].text).toContain('123');
    expect(result.content[0].text).toContain('準點');
    expect(result.content[0].text).toContain('誤點 5 分鐘');
  });

  it('returns all stations when no stationId', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleData);
    const result = await getTraLiveboard(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台鐵即時到離站');
  });

  it('handles empty liveboard data', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([]);
    const result = await getTraLiveboard(env, { stationId: '9999' });
    expect(result.content[0].text).toContain('找不到車站 9999');
  });

  it('handles API error gracefully', async () => {
    mockFetchEndpoint.mockRejectedValueOnce(new Error('liveboard error'));
    const result = await getTraLiveboard(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('liveboard error');
  });
});

// --- Metro ---
describe('getMetroInfo', () => {
  const sampleData = [
    {
      RouteID: 'BL',
      RouteName: { Zh_tw: '板南線', En: 'Bannan Line' },
      LineID: 'BL',
      Stations: [
        { StationID: 'BL01', StationName: { Zh_tw: '頂埔', En: 'Dingpu' }, Sequence: 1 },
        { StationID: 'BL02', StationName: { Zh_tw: '永寧', En: 'Yongning' }, Sequence: 2 },
      ],
    },
    {
      RouteID: 'R',
      RouteName: { Zh_tw: '淡水信義線', En: 'Tamsui-Xinyi Line' },
      LineID: 'R',
      Stations: [
        { StationID: 'R01', StationName: { Zh_tw: '淡水', En: 'Tamsui' }, Sequence: 1 },
      ],
    },
  ];

  it('returns all metro routes for operator', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleData);
    const result = await getMetroInfo(env, { operator: 'TRTC' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('台北捷運');
    expect(result.content[0].text).toContain('板南線');
    expect(result.content[0].text).toContain('淡水信義線');
  });

  it('filters by line when specified', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleData);
    const result = await getMetroInfo(env, { operator: 'TRTC', line: 'BL' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('板南線');
    expect(result.content[0].text).toContain('頂埔');
  });

  it('returns error for invalid operator', async () => {
    const result = await getMetroInfo(env, { operator: 'INVALID' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('無效的營運商代碼');
  });

  it('handles API error gracefully', async () => {
    mockFetchEndpoint.mockRejectedValueOnce(new Error('metro error'));
    const result = await getMetroInfo(env, { operator: 'TRTC' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('metro error');
  });
});

// --- Bus Arrival ---
describe('getBusArrival', () => {
  const sampleData = [
    {
      RouteName: { Zh_tw: '307', En: '307' },
      StopName: { Zh_tw: '台北車站', En: 'Taipei Main Station' },
      EstimateTime: 180,
      StopStatus: 0,
      Direction: 0,
    },
    {
      RouteName: { Zh_tw: '307', En: '307' },
      StopName: { Zh_tw: '中山站', En: 'Zhongshan' },
      EstimateTime: undefined,
      StopStatus: 3,
      Direction: 0,
    },
  ];

  it('returns bus arrival info', async () => {
    mockFetchEndpoint.mockResolvedValueOnce(sampleData);
    const result = await getBusArrival(env, { city: 'Taipei', routeName: '307' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('307');
    expect(result.content[0].text).toContain('台北車站');
    expect(result.content[0].text).toContain('約 3 分鐘');
    expect(result.content[0].text).toContain('末班已過');
  });

  it('returns not-found when no bus data', async () => {
    mockFetchEndpoint.mockResolvedValueOnce([]);
    const result = await getBusArrival(env, { city: 'Taipei', routeName: '999' });
    expect(result.content[0].text).toContain('找不到');
  });

  it('returns error when city/routeName missing', async () => {
    const result = await getBusArrival(env, { city: 'Taipei' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('路線名稱');
  });

  it('handles API error gracefully', async () => {
    mockFetchEndpoint.mockRejectedValueOnce(new Error('bus error'));
    const result = await getBusArrival(env, { city: 'Taipei', routeName: '307' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('bus error');
  });
});
