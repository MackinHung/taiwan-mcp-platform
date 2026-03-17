import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

interface RainRecords {
  Station: Array<{
    StationName: string;
    GeoInfo: { CountyName: string };
    RainfallElement: {
      Now: { Precipitation: number };
      Past1hr: { Precipitation: number };
      Past24hr: { Precipitation: number };
    };
    ObsTime: { DateTime: string };
  }>;
}

export async function getRainObservation(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;

    const records = await fetchDataset<RainRecords>(
      env.CWA_API_KEY,
      DATASETS.RAIN
    );

    let stations = records.Station ?? [];
    if (stations.length === 0) {
      return {
        content: [{ type: 'text', text: '無雨量觀測資料' }],
      };
    }

    if (city) {
      stations = stations.filter((s) => s.GeoInfo.CountyName === city);
      if (stations.length === 0) {
        return {
          content: [
            { type: 'text', text: `找不到 ${city} 的雨量觀測站` },
          ],
        };
      }
    }

    const lines = stations.map((s) => {
      const r = s.RainfallElement;
      return [
        `${s.StationName} (${s.GeoInfo.CountyName})`,
        `  觀測時間: ${s.ObsTime.DateTime}`,
        `  即時雨量: ${r.Now.Precipitation} mm`,
        `  過去 1 小時: ${r.Past1hr.Precipitation} mm`,
        `  過去 24 小時: ${r.Past24hr.Precipitation} mm`,
      ].join('\n');
    });

    return { content: [{ type: 'text', text: lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得雨量資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
