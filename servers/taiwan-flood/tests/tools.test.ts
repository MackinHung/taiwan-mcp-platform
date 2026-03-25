import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  WRA_DATASETS: {
    FLOOD_POTENTIAL: '53564',
    RESERVOIR: '45501',
    RIVER_LEVEL: '25768',
    RAINFALL: '9177',
  },
  buildWraUrl: vi.fn(),
  buildSensorThingsUrl: vi.fn(),
  fetchWraDataset: vi.fn(),
  fetchSensorThings: vi.fn(),
}));

import { fetchWraDataset, fetchSensorThings } from '../src/client.js';
import { getFloodPotential } from '../src/tools/flood-potential.js';
import { getRiverWaterLevel } from '../src/tools/river-level.js';
import { getRainfallData } from '../src/tools/rainfall.js';
import { getFloodWarnings } from '../src/tools/warnings.js';
import { getReservoirStatus } from '../src/tools/reservoir.js';
import type { Env } from '../src/types.js';

const mockFetchWra = vi.mocked(fetchWraDataset);
const mockFetchSensor = vi.mocked(fetchSensorThings);

const env: Env = {
  SERVER_NAME: 'taiwan-flood',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchWra.mockReset();
  mockFetchSensor.mockReset();
});

// --- Flood Potential ---
describe('getFloodPotential', () => {
  const sampleRecords = [
    {
      County: '臺北市',
      Town: '信義區',
      Village: '永吉里',
      ReturnPeriod: '200年',
      FloodDepth: '0.5',
      UpdateTime: '2026-03-25',
    },
    {
      County: '新北市',
      Town: '板橋區',
      Village: '民生里',
      ReturnPeriod: '100年',
      FloodDepth: '0.3',
      UpdateTime: '2026-03-25',
    },
  ];

  it('returns flood potential data for specific county', async () => {
    mockFetchWra.mockResolvedValueOnce(sampleRecords);
    const result = await getFloodPotential(env, { county: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
    expect(result.content[0].text).toContain('信義區');
    expect(result.content[0].text).toContain('0.5');
    expect(mockFetchWra).toHaveBeenCalledWith('53564', { County: '臺北市' });
  });

  it('returns all data when no county specified', async () => {
    mockFetchWra.mockResolvedValueOnce(sampleRecords);
    const result = await getFloodPotential(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市');
    expect(result.content[0].text).toContain('新北市');
    expect(mockFetchWra).toHaveBeenCalledWith('53564', undefined);
  });

  it('handles empty result', async () => {
    mockFetchWra.mockResolvedValueOnce([]);
    const result = await getFloodPotential(env, { county: '不存在市' });
    expect(result.content[0].text).toContain('找不到 不存在市');
  });

  it('handles API error gracefully', async () => {
    mockFetchWra.mockRejectedValueOnce(new Error('API timeout'));
    const result = await getFloodPotential(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API timeout');
  });

  it('filters by town when specified', async () => {
    mockFetchWra.mockResolvedValueOnce(sampleRecords);
    const result = await getFloodPotential(env, { county: '臺北市', town: '信義區' });
    expect(result.isError).toBeUndefined();
    expect(mockFetchWra).toHaveBeenCalledWith('53564', { County: '臺北市', Town: '信義區' });
  });
});

// --- River Water Level ---
describe('getRiverWaterLevel', () => {
  const sampleRecords = [
    {
      StationIdentifier: 'S001',
      StationName: '中正橋',
      RiverName: '新店溪',
      WaterLevel: '5.2',
      RecordTime: '2026-03-25T10:00:00',
      WarningLevel1: '6.0',
      WarningLevel2: '7.0',
      WarningLevel3: '8.0',
    },
    {
      StationIdentifier: 'S002',
      StationName: '秀朗橋',
      RiverName: '新店溪',
      WaterLevel: '7.5',
      RecordTime: '2026-03-25T10:00:00',
      WarningLevel1: '6.0',
      WarningLevel2: '7.0',
      WarningLevel3: '8.0',
    },
    {
      StationIdentifier: 'S003',
      StationName: '大漢橋',
      RiverName: '大漢溪',
      WaterLevel: '3.1',
      RecordTime: '2026-03-25T10:00:00',
      WarningLevel1: '5.0',
      WarningLevel2: '6.0',
      WarningLevel3: '7.0',
    },
  ];

  it('returns river level data filtered by river name', async () => {
    mockFetchWra.mockResolvedValueOnce(sampleRecords);
    const result = await getRiverWaterLevel(env, { river_name: '新店溪' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('新店溪');
    expect(result.content[0].text).toContain('中正橋');
    expect(result.content[0].text).not.toContain('大漢溪');
  });

  it('returns all stations when no filter', async () => {
    mockFetchWra.mockResolvedValueOnce(sampleRecords);
    const result = await getRiverWaterLevel(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('中正橋');
    expect(result.content[0].text).toContain('大漢橋');
  });

  it('handles empty result', async () => {
    mockFetchWra.mockResolvedValueOnce([]);
    const result = await getRiverWaterLevel(env, { river_name: '不存在河' });
    expect(result.content[0].text).toContain('找不到 不存在河');
  });

  it('handles API error gracefully', async () => {
    mockFetchWra.mockRejectedValueOnce(new Error('connection refused'));
    const result = await getRiverWaterLevel(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });

  it('shows correct warning status', async () => {
    mockFetchWra.mockResolvedValueOnce(sampleRecords);
    const result = await getRiverWaterLevel(env, {});
    const text = result.content[0].text;
    // S001: 5.2 < 6.0 -> 正常
    expect(text).toContain('正常');
    // S002: 7.5 >= 7.0 -> 二級警戒
    expect(text).toContain('二級警戒');
  });
});

// --- Rainfall Data ---
describe('getRainfallData', () => {
  const sampleRecords = [
    {
      StationIdentifier: 'R001',
      StationName: '大直',
      CityName: '臺北市',
      Rainfall10min: '2.5',
      Rainfall1hr: '15.0',
      Rainfall3hr: '30.0',
      Rainfall6hr: '45.0',
      Rainfall12hr: '60.0',
      Rainfall24hr: '80.0',
      RecordTime: '2026-03-25T10:00:00',
    },
    {
      StationIdentifier: 'R002',
      StationName: '板橋',
      CityName: '新北市',
      Rainfall10min: '1.0',
      Rainfall1hr: '5.0',
      Rainfall3hr: '10.0',
      Rainfall6hr: '20.0',
      Rainfall12hr: '30.0',
      Rainfall24hr: '50.0',
      RecordTime: '2026-03-25T10:00:00',
    },
  ];

  it('returns rainfall data for specific city', async () => {
    mockFetchWra.mockResolvedValueOnce(sampleRecords);
    const result = await getRainfallData(env, { city: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('大直');
    expect(result.content[0].text).toContain('15.0');
    expect(result.content[0].text).not.toContain('板橋');
  });

  it('returns all stations when no filter', async () => {
    mockFetchWra.mockResolvedValueOnce(sampleRecords);
    const result = await getRainfallData(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('大直');
    expect(result.content[0].text).toContain('板橋');
  });

  it('handles empty result', async () => {
    mockFetchWra.mockResolvedValueOnce([]);
    const result = await getRainfallData(env, {});
    expect(result.content[0].text).toContain('無雨量觀測資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchWra.mockRejectedValueOnce(new Error('rainfall API down'));
    const result = await getRainfallData(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rainfall API down');
  });

  it('filters by station name', async () => {
    mockFetchWra.mockResolvedValueOnce(sampleRecords);
    const result = await getRainfallData(env, { station_name: '大直' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('大直');
    expect(result.content[0].text).not.toContain('板橋');
  });
});

// --- Flood Warnings ---
describe('getFloodWarnings', () => {
  const sampleDatastreams = [
    {
      '@iot.id': 1,
      name: 'flood-sensor-001',
      description: '臺北市信義區淹水感測器',
      observationType: 'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement',
      Thing: { name: '臺北市信義區', description: '信義區淹水感測器', properties: { type: 'flood_sensor' } },
      Observations: [{ phenomenonTime: '2026-03-25T10:00:00Z', result: 0.35, resultTime: '2026-03-25T10:00:00Z' }],
    },
    {
      '@iot.id': 2,
      name: 'flood-sensor-002',
      description: '新北市板橋區淹水感測器',
      observationType: 'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement',
      Thing: { name: '新北市板橋區', description: '板橋區淹水感測器', properties: { type: 'flood_sensor' } },
      Observations: [{ phenomenonTime: '2026-03-25T10:00:00Z', result: 0.02, resultTime: '2026-03-25T10:00:00Z' }],
    },
    {
      '@iot.id': 3,
      name: 'flood-sensor-003',
      description: '高雄市前鎮區淹水感測器',
      observationType: 'http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement',
      Thing: { name: '高雄市前鎮區', description: '前鎮區淹水感測器', properties: { type: 'flood_sensor' } },
      Observations: [{ phenomenonTime: '2026-03-25T10:00:00Z', result: 0.55, resultTime: '2026-03-25T10:00:00Z' }],
    },
  ];

  it('returns flood warnings for elevated water levels', async () => {
    mockFetchSensor.mockResolvedValueOnce(sampleDatastreams);
    const result = await getFloodWarnings(env, {});
    expect(result.isError).toBeUndefined();
    // Should include sensors with water level > 0.1
    expect(result.content[0].text).toContain('臺北市信義區');
    expect(result.content[0].text).toContain('高雄市前鎮區');
    // 0.02 should be excluded
    expect(result.content[0].text).not.toContain('板橋');
  });

  it('filters by county', async () => {
    mockFetchSensor.mockResolvedValueOnce(sampleDatastreams);
    const result = await getFloodWarnings(env, { county: '臺北市' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('臺北市信義區');
    expect(result.content[0].text).not.toContain('高雄市');
  });

  it('returns no-warning message when all levels are low', async () => {
    const lowDatastreams = [
      {
        '@iot.id': 1,
        name: 'sensor-low',
        description: 'low level',
        observationType: 'measurement',
        Thing: { name: '臺北市中正區', description: 'sensor' },
        Observations: [{ phenomenonTime: '2026-03-25T10:00:00Z', result: 0.01, resultTime: '2026-03-25T10:00:00Z' }],
      },
    ];
    mockFetchSensor.mockResolvedValueOnce(lowDatastreams);
    const result = await getFloodWarnings(env, {});
    expect(result.content[0].text).toContain('無淹水警報');
  });

  it('handles empty datastreams', async () => {
    mockFetchSensor.mockResolvedValueOnce([]);
    const result = await getFloodWarnings(env, {});
    expect(result.content[0].text).toContain('無淹水警報');
  });

  it('handles API error gracefully', async () => {
    mockFetchSensor.mockRejectedValueOnce(new Error('SensorThings error'));
    const result = await getFloodWarnings(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('SensorThings error');
  });

  it('shows correct severity levels', async () => {
    mockFetchSensor.mockResolvedValueOnce(sampleDatastreams);
    const result = await getFloodWarnings(env, {});
    const text = result.content[0].text;
    // 0.35 >= 0.3 -> 警戒
    expect(text).toContain('警戒');
    // 0.55 >= 0.5 -> 嚴重
    expect(text).toContain('嚴重');
  });

  it('handles string result type in observations', async () => {
    const stringResultStreams = [
      {
        '@iot.id': 10,
        name: 'sensor-string',
        description: 'string result sensor',
        observationType: 'measurement',
        Thing: { name: '桃園市中壢區', description: 'sensor' },
        Observations: [{ phenomenonTime: '2026-03-25T10:00:00Z', result: '0.45', resultTime: '2026-03-25T10:00:00Z' }],
      },
    ];
    mockFetchSensor.mockResolvedValueOnce(stringResultStreams);
    const result = await getFloodWarnings(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('桃園市中壢區');
    expect(result.content[0].text).toContain('0.45');
  });
});

// --- Reservoir Status ---
describe('getReservoirStatus', () => {
  const sampleRecords = [
    {
      ReservoirIdentifier: 'RV001',
      ReservoirName: '石門水庫',
      EffectiveCapacity: '20000',
      CurrentCapacity: '16000',
      PercentageOfStorage: '80.0',
      WaterInflow: '15.5',
      WaterOutflow: '10.2',
      RecordTime: '2026-03-25T10:00:00',
    },
    {
      ReservoirIdentifier: 'RV002',
      ReservoirName: '翡翠水庫',
      EffectiveCapacity: '30000',
      CurrentCapacity: '6000',
      PercentageOfStorage: '20.0',
      WaterInflow: '5.0',
      WaterOutflow: '8.0',
      RecordTime: '2026-03-25T10:00:00',
    },
    {
      ReservoirIdentifier: 'RV003',
      ReservoirName: '曾文水庫',
      EffectiveCapacity: '50000',
      CurrentCapacity: '2500',
      PercentageOfStorage: '5.0',
      WaterInflow: '1.0',
      WaterOutflow: '3.0',
      RecordTime: '2026-03-25T10:00:00',
    },
  ];

  it('returns reservoir data for specific name', async () => {
    mockFetchWra.mockResolvedValueOnce(sampleRecords);
    const result = await getReservoirStatus(env, { reservoir_name: '石門' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('石門水庫');
    expect(result.content[0].text).toContain('80.0');
    expect(result.content[0].text).toContain('充沛');
  });

  it('returns all reservoirs when no filter', async () => {
    mockFetchWra.mockResolvedValueOnce(sampleRecords);
    const result = await getReservoirStatus(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('石門水庫');
    expect(result.content[0].text).toContain('翡翠水庫');
    expect(result.content[0].text).toContain('曾文水庫');
  });

  it('handles empty result', async () => {
    mockFetchWra.mockResolvedValueOnce([]);
    const result = await getReservoirStatus(env, { reservoir_name: '不存在水庫' });
    expect(result.content[0].text).toContain('找不到 不存在水庫');
  });

  it('handles API error gracefully', async () => {
    mockFetchWra.mockRejectedValueOnce(new Error('WRA down'));
    const result = await getReservoirStatus(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('WRA down');
  });

  it('shows correct storage status levels', async () => {
    mockFetchWra.mockResolvedValueOnce(sampleRecords);
    const result = await getReservoirStatus(env, {});
    const text = result.content[0].text;
    // 80% -> 充沛
    expect(text).toContain('充沛');
    // 20% -> 偏低  (wait, 20% >= 10 and < 30 -> 警戒)
    expect(text).toContain('警戒');
    // 5% -> 嚴重不足
    expect(text).toContain('嚴重不足');
  });
});
