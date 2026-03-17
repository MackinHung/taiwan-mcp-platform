import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult, EarthquakeRecord } from '../types.js';

export async function getEarthquakeRecent(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = (args.limit as number) ?? 5;

    const records = await fetchDataset<{ Earthquake: EarthquakeRecord[] }>(
      env.CWA_API_KEY,
      DATASETS.EARTHQUAKE
    );

    const quakes = records.Earthquake ?? [];
    if (quakes.length === 0) {
      return {
        content: [{ type: 'text', text: '無最近地震資料' }],
      };
    }

    const sliced = quakes.slice(0, limit);
    const lines = sliced.map((eq) => {
      const info = eq.EarthquakeInfo;
      return [
        `地震編號: ${eq.EarthquakeNo}`,
        `  時間: ${info.OriginTime}`,
        `  位置: ${info.EpiCenter.Location}`,
        `  深度: ${info.FocalDepth} km`,
        `  規模: ${info.EarthquakeMagnitude.MagnitudeType} ${info.EarthquakeMagnitude.MagnitudeValue}`,
        `  報告: ${eq.ReportContent}`,
      ].join('\n');
    });

    return { content: [{ type: 'text', text: lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得地震資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
