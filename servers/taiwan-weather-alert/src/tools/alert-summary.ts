import { fetchDataset, DATASETS } from '../client.js';
import type {
  Env,
  ToolResult,
  EarthquakeReport,
  WeatherWarningRecords,
  TyphoonRecords,
  HeavyRainRecords,
} from '../types.js';

interface EarthquakeRecords {
  Earthquake: EarthquakeReport[];
}

interface SectionResult {
  title: string;
  count: number;
  summary: string;
}

function summarizeEarthquakes(
  felt: PromiseSettledResult<EarthquakeRecords>,
  local: PromiseSettledResult<EarthquakeRecords>
): SectionResult {
  const feltQuakes =
    felt.status === 'fulfilled' ? felt.value.Earthquake ?? [] : [];
  const localQuakes =
    local.status === 'fulfilled' ? local.value.Earthquake ?? [] : [];
  const total = feltQuakes.length + localQuakes.length;

  if (total === 0) {
    return { title: '地震速報', count: 0, summary: '無最近地震資料' };
  }

  const latest = [...feltQuakes, ...localQuakes].sort((a, b) =>
    b.EarthquakeInfo.OriginTime.localeCompare(a.EarthquakeInfo.OriginTime)
  )[0];

  const info = latest.EarthquakeInfo;
  return {
    title: '地震速報',
    count: total,
    summary: `最新: ${info.OriginTime} ${info.EpiCenter.Location} 規模${info.EarthquakeMagnitude.MagnitudeValue}`,
  };
}

function summarizeWarnings(
  result: PromiseSettledResult<WeatherWarningRecords>
): SectionResult {
  if (result.status !== 'fulfilled') {
    return { title: '天氣警特報', count: 0, summary: '查詢失敗' };
  }

  const records = result.value.record ?? [];
  let count = 0;
  const types: string[] = [];

  for (const rec of records) {
    const hazards = rec.hazardConditions?.hazards?.hazard ?? [];
    count += hazards.length;
    for (const h of hazards) {
      const label = `${h.info.phenomena}${h.info.significance}`;
      if (!types.includes(label)) {
        types.push(label);
      }
    }
  }

  if (count === 0) {
    return { title: '天氣警特報', count: 0, summary: '目前無警特報' };
  }

  return {
    title: '天氣警特報',
    count,
    summary: `生效中: ${types.join('、')}`,
  };
}

function summarizeTyphoon(
  result: PromiseSettledResult<TyphoonRecords>
): SectionResult {
  if (result.status !== 'fulfilled') {
    return { title: '颱風警報', count: 0, summary: '查詢失敗' };
  }

  const cyclones = result.value.tropicalCyclones?.tropicalCyclone ?? [];
  if (cyclones.length === 0) {
    return { title: '颱風警報', count: 0, summary: '目前無颱風警報' };
  }

  const names = cyclones.map((tc) => `${tc.typhoonName}(${tc.cwaTyphoonName})`);
  return {
    title: '颱風警報',
    count: cyclones.length,
    summary: `活躍颱風: ${names.join('、')}`,
  };
}

function summarizeHeavyRain(
  result: PromiseSettledResult<HeavyRainRecords>
): SectionResult {
  if (result.status !== 'fulfilled') {
    return { title: '豪大雨特報', count: 0, summary: '查詢失敗' };
  }

  const records = result.value.record ?? [];
  let count = 0;
  const areas: string[] = [];

  for (const rec of records) {
    const hazards = rec.hazardConditions?.hazards?.hazard ?? [];
    count += hazards.length;
    for (const h of hazards) {
      const locs = h.affectedAreas?.location?.map((l) => l.locationName) ?? [];
      for (const loc of locs) {
        if (!areas.includes(loc)) {
          areas.push(loc);
        }
      }
    }
  }

  if (count === 0) {
    return { title: '豪大雨特報', count: 0, summary: '目前無豪大雨特報' };
  }

  return {
    title: '豪大雨特報',
    count,
    summary: `影響地區: ${areas.slice(0, 5).join('、')}${areas.length > 5 ? '等' : ''}`,
  };
}

export async function getAlertSummary(
  env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const [felt, local, warning, typhoon, heavyRain] = await Promise.allSettled([
      fetchDataset<EarthquakeRecords>(env.CWA_API_KEY, DATASETS.EARTHQUAKE_FELT),
      fetchDataset<EarthquakeRecords>(env.CWA_API_KEY, DATASETS.EARTHQUAKE_LOCAL),
      fetchDataset<WeatherWarningRecords>(env.CWA_API_KEY, DATASETS.WEATHER_WARNING),
      fetchDataset<TyphoonRecords>(env.CWA_API_KEY, DATASETS.TYPHOON),
      fetchDataset<HeavyRainRecords>(env.CWA_API_KEY, DATASETS.HEAVY_RAIN),
    ]);

    const sections: SectionResult[] = [
      summarizeEarthquakes(felt, local),
      summarizeWarnings(warning),
      summarizeTyphoon(typhoon),
      summarizeHeavyRain(heavyRain),
    ];

    const totalActive = sections.reduce((sum, s) => sum + s.count, 0);
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const lines = [
      `=== 台灣即時預警摘要 ===`,
      `查詢時間: ${now}`,
      `生效中警報總數: ${totalActive}`,
      '',
      ...sections.map(
        (s) => `【${s.title}】(${s.count} 則)\n  ${s.summary}`
      ),
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得預警摘要失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
