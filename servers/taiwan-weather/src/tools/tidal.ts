import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

interface TidalRecords {
  TideForecasts: {
    Location: Array<{
      LocationName: string;
      TimePeriods: {
        Daily: Array<{
          Date: string;
          Time: Array<{
            DateTime: string;
            Tide: string;
            TideHeights: { AboveTWVD: number };
          }>;
        }>;
      };
    }>;
  };
}

export async function getTidalForecast(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const port = args.port as string | undefined;

    const records = await fetchDataset<TidalRecords>(
      env.CWA_API_KEY,
      DATASETS.TIDAL
    );

    let locations = records.TideForecasts?.Location ?? [];
    if (locations.length === 0) {
      return {
        content: [{ type: 'text', text: '無潮汐資料' }],
      };
    }

    if (port) {
      locations = locations.filter((l) => l.LocationName === port);
      if (locations.length === 0) {
        return {
          content: [
            { type: 'text', text: `找不到 ${port} 的潮汐資料` },
          ],
        };
      }
    }

    const lines = locations.map((loc) => {
      const dailyLines = loc.TimePeriods.Daily.map((day) => {
        const tides = day.Time.map(
          (t) =>
            `    ${t.DateTime} ${t.Tide} (${t.TideHeights.AboveTWVD} m)`
        ).join('\n');
        return `  ${day.Date}\n${tides}`;
      }).join('\n');
      return `${loc.LocationName}\n${dailyLines}`;
    });

    return { content: [{ type: 'text', text: lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得潮汐資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
