import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  DATASETS: {
    NOTIFIABLE_DISEASES: 'notifiable-diseases-id',
    VACCINATION: 'vaccination-id',
    OUTBREAK_ALERTS: 'outbreak-alerts-id',
    EPIDEMIC_TRENDS: 'epidemic-trends-id',
    DISEASE_INFO: 'disease-info-id',
  },
  buildUrl: vi.fn(),
  fetchDataset: vi.fn(),
}));

import { fetchDataset } from '../src/client.js';
import { getDiseaseStatistics } from '../src/tools/disease-stats.js';
import { getVaccinationInfo } from '../src/tools/vaccination.js';
import { getOutbreakAlerts } from '../src/tools/outbreak-alerts.js';
import { getEpidemicTrends } from '../src/tools/epidemic-trends.js';
import { searchDiseaseInfo } from '../src/tools/disease-info.js';
import type { Env } from '../src/types.js';

const mockFetchDataset = vi.mocked(fetchDataset);

const env: Env = {
  SERVER_NAME: 'taiwan-cdc',
  SERVER_VERSION: '1.0.0',
};

beforeEach(() => {
  mockFetchDataset.mockReset();
});

// --- Disease Statistics ---
describe('getDiseaseStatistics', () => {
  const sampleData = {
    records: [
      {
        '疾病名稱': '登革熱',
        '年度': '2024',
        '通報病例數': '500',
        '確定病例數': '350',
        '地區': '高雄市',
      },
    ],
    total: 1,
  };

  it('returns disease statistics data', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    const result = await getDiseaseStatistics(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('登革熱');
    expect(result.content[0].text).toContain('350');
    expect(result.content[0].text).toContain('法定傳染病統計');
  });

  it('passes disease query to fetchDataset', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    await getDiseaseStatistics(env, { disease: '登革熱' });
    expect(mockFetchDataset).toHaveBeenCalledWith('notifiable-diseases-id', {
      limit: 30,
      q: '登革熱',
    });
  });

  it('passes disease and year query', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    await getDiseaseStatistics(env, { disease: '登革熱', year: 2024 });
    expect(mockFetchDataset).toHaveBeenCalledWith('notifiable-diseases-id', {
      limit: 30,
      q: '登革熱 2024',
    });
  });

  it('handles empty results', async () => {
    mockFetchDataset.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getDiseaseStatistics(env, { disease: '不存在疾病' });
    expect(result.content[0].text).toContain('查無符合條件的傳染病統計資料');
    expect(result.content[0].text).toContain('不存在疾病');
  });

  it('handles empty results without filters', async () => {
    mockFetchDataset.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getDiseaseStatistics(env, {});
    expect(result.content[0].text).toContain('查無法定傳染病統計資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('API down'));
    const result = await getDiseaseStatistics(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API down');
  });
});

// --- Vaccination Info ---
describe('getVaccinationInfo', () => {
  const sampleData = {
    records: [
      {
        '疫苗名稱': 'COVID-19疫苗',
        '接種劑次': '第三劑',
        '接種人數': '15000000',
        '涵蓋率': '65%',
        '適用對象': '12歲以上',
      },
    ],
    total: 1,
  };

  it('returns vaccination data', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    const result = await getVaccinationInfo(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('COVID-19疫苗');
    expect(result.content[0].text).toContain('65%');
    expect(result.content[0].text).toContain('疫苗接種資訊');
  });

  it('passes vaccine query to fetchDataset', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    await getVaccinationInfo(env, { vaccine: 'COVID-19' });
    expect(mockFetchDataset).toHaveBeenCalledWith('vaccination-id', {
      limit: 30,
      q: 'COVID-19',
    });
  });

  it('handles empty results', async () => {
    mockFetchDataset.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getVaccinationInfo(env, { vaccine: '不存在疫苗' });
    expect(result.content[0].text).toContain('查無疫苗「不存在疫苗」的接種資訊');
  });

  it('handles empty results without filter', async () => {
    mockFetchDataset.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getVaccinationInfo(env, {});
    expect(result.content[0].text).toContain('查無疫苗接種資訊');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('timeout'));
    const result = await getVaccinationInfo(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('timeout');
  });
});

// --- Outbreak Alerts ---
describe('getOutbreakAlerts', () => {
  const sampleData = {
    records: [
      {
        '通報日期': '2024-06-15',
        '疾病名稱': '登革熱',
        '通報地區': '台南市',
        '病例數': '25',
        '警示等級': '中度',
        '說明': '群聚感染事件',
      },
    ],
    total: 1,
  };

  it('returns outbreak alert data', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    const result = await getOutbreakAlerts(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('登革熱');
    expect(result.content[0].text).toContain('台南市');
    expect(result.content[0].text).toContain('群聚感染事件');
    expect(result.content[0].text).toContain('疫情通報/警示');
  });

  it('uses default limit of 20', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    await getOutbreakAlerts(env, {});
    expect(mockFetchDataset).toHaveBeenCalledWith('outbreak-alerts-id', {
      limit: 20,
    });
  });

  it('respects custom limit', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    await getOutbreakAlerts(env, { limit: 5 });
    expect(mockFetchDataset).toHaveBeenCalledWith('outbreak-alerts-id', {
      limit: 5,
    });
  });

  it('handles empty results', async () => {
    mockFetchDataset.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getOutbreakAlerts(env, {});
    expect(result.content[0].text).toContain('目前無疫情通報/警示資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('server error'));
    const result = await getOutbreakAlerts(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server error');
  });
});

// --- Epidemic Trends ---
describe('getEpidemicTrends', () => {
  const sampleData = {
    records: [
      {
        '疾病名稱': '流感',
        '年度': '2024',
        '週別': '第25週',
        '地區': '台北市',
        '確定病例數': '1200',
      },
    ],
    total: 1,
  };

  it('returns epidemic trend data', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    const result = await getEpidemicTrends(env, {});
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('流感');
    expect(result.content[0].text).toContain('第25週');
    expect(result.content[0].text).toContain('疫情趨勢');
  });

  it('passes disease and region query', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    await getEpidemicTrends(env, { disease: '流感', region: '台北市' });
    expect(mockFetchDataset).toHaveBeenCalledWith('epidemic-trends-id', {
      limit: 30,
      q: '流感 台北市',
    });
  });

  it('handles empty results with filters', async () => {
    mockFetchDataset.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getEpidemicTrends(env, { disease: '不存在' });
    expect(result.content[0].text).toContain('查無符合條件的疫情趨勢資料');
    expect(result.content[0].text).toContain('不存在');
  });

  it('handles empty results without filters', async () => {
    mockFetchDataset.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await getEpidemicTrends(env, {});
    expect(result.content[0].text).toContain('查無疫情趨勢資料');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('db error'));
    const result = await getEpidemicTrends(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('db error');
  });
});

// --- Disease Info ---
describe('searchDiseaseInfo', () => {
  const sampleData = {
    records: [
      {
        '疾病名稱': '登革熱',
        '疾病介紹': '由登革病毒引起的急性傳染病',
        '預防方法': '清除積水容器',
        '症狀': '發燒、頭痛、肌肉痛',
        '傳染途徑': '蚊蟲叮咬',
      },
    ],
    total: 1,
  };

  it('returns disease info for keyword search', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    const result = await searchDiseaseInfo(env, { keyword: '登革熱' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('登革熱');
    expect(result.content[0].text).toContain('蚊蟲叮咬');
    expect(result.content[0].text).toContain('清除積水容器');
    expect(result.content[0].text).toContain('傳染病資訊搜尋');
  });

  it('passes keyword as q parameter', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    await searchDiseaseInfo(env, { keyword: '登革熱' });
    expect(mockFetchDataset).toHaveBeenCalledWith('disease-info-id', {
      limit: 20,
      q: '登革熱',
    });
  });

  it('returns no-results message when nothing matches', async () => {
    mockFetchDataset.mockResolvedValueOnce({ records: [], total: 0 });
    const result = await searchDiseaseInfo(env, { keyword: '完全不存在的疾病' });
    expect(result.content[0].text).toContain('無符合的傳染病資訊');
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchDiseaseInfo(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchDiseaseInfo(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供搜尋關鍵字');
  });

  it('handles API error gracefully', async () => {
    mockFetchDataset.mockRejectedValueOnce(new Error('connection lost'));
    const result = await searchDiseaseInfo(env, { keyword: '流感' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection lost');
  });

  it('respects limit parameter', async () => {
    mockFetchDataset.mockResolvedValueOnce(sampleData);
    await searchDiseaseInfo(env, { keyword: '登革熱', limit: 5 });
    expect(mockFetchDataset).toHaveBeenCalledWith('disease-info-id', {
      limit: 5,
      q: '登革熱',
    });
  });
});
