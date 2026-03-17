import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

interface UvRecords {
  WeatherElement: {
    Location: Array<{
      LocationName: string;
      UVIndex: { UVIndex: number; PublishAgency: string };
    }>;
  };
}

function uvLevel(index: number): string {
  if (index <= 2) return '低量級';
  if (index <= 5) return '中量級';
  if (index <= 7) return '高量級';
  if (index <= 10) return '過量級';
  return '危險級';
}

export async function getUvIndex(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;

    const records = await fetchDataset<UvRecords>(
      env.CWA_API_KEY,
      DATASETS.UV
    );

    let locations = records.WeatherElement?.Location ?? [];
    if (locations.length === 0) {
      return {
        content: [{ type: 'text', text: '無紫外線資料' }],
      };
    }

    if (city) {
      locations = locations.filter((l) => l.LocationName === city);
      if (locations.length === 0) {
        return {
          content: [
            { type: 'text', text: `找不到 ${city} 的紫外線資料` },
          ],
        };
      }
    }

    const lines = locations.map((loc) => {
      const idx = loc.UVIndex.UVIndex;
      return `${loc.LocationName}: UV ${idx} (${uvLevel(idx)})`;
    });

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得紫外線資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
