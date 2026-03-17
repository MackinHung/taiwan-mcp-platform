import type { Env, ToolResult } from '../types.js';
import { fetchAqiData } from '../client.js';

const DEFAULT_THRESHOLD = 100;

export async function getUnhealthyStations(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const threshold = Math.max((args.threshold as number) ?? DEFAULT_THRESHOLD, 0);

    const records = await fetchAqiData(env.MOENV_API_KEY);

    const unhealthy = records
      .filter((r) => {
        const aqi = parseInt(r.aqi, 10);
        return !isNaN(aqi) && aqi > threshold;
      })
      .sort((a, b) => parseInt(b.aqi, 10) - parseInt(a.aqi, 10));

    if (unhealthy.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `目前沒有測站 AQI 超過 ${threshold}，空氣品質良好`,
          },
        ],
      };
    }

    const lines = unhealthy.map(
      (r) =>
        `${r.sitename}（${r.county}）— AQI: ${r.aqi} ${r.status} | 主要污染物: ${r.pollutant || '無'}`
    );

    return {
      content: [
        {
          type: 'text',
          text: `AQI 超過 ${threshold} 的測站（共 ${unhealthy.length} 站）\n\n${lines.join('\n')}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得不健康測站資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}

export async function getCountySummary(
  env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const records = await fetchAqiData(env.MOENV_API_KEY);

    const byCounty = new Map<string, number[]>();
    for (const r of records) {
      const aqi = parseInt(r.aqi, 10);
      if (isNaN(aqi)) continue;
      const list = byCounty.get(r.county) ?? [];
      list.push(aqi);
      byCounty.set(r.county, list);
    }

    if (byCounty.size === 0) {
      return {
        content: [{ type: 'text', text: '無可用 AQI 資料' }],
      };
    }

    const summaries = [...byCounty.entries()]
      .map(([county, aqis]) => {
        const avg = Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length);
        const max = Math.max(...aqis);
        const min = Math.min(...aqis);
        return { county, avg, max, min, count: aqis.length };
      })
      .sort((a, b) => b.avg - a.avg);

    const lines = summaries.map(
      (s) =>
        `${s.county}（${s.count} 站）— 平均 AQI: ${s.avg} | 最高: ${s.max} | 最低: ${s.min}`
    );

    return {
      content: [
        {
          type: 'text',
          text: `各縣市空氣品質摘要\n\n${lines.join('\n')}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得縣市摘要失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
