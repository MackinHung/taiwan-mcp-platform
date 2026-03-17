import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult, EarthquakeReport } from '../types.js';

interface EarthquakeRecords {
  Earthquake: EarthquakeReport[];
}

function formatQuake(eq: EarthquakeReport): string {
  const info = eq.EarthquakeInfo;
  const parts = [
    `地震編號: ${eq.EarthquakeNo}`,
    `  時間: ${info.OriginTime}`,
    `  位置: ${info.EpiCenter.Location}`,
    `  深度: ${info.FocalDepth} km`,
    `  規模: ${info.EarthquakeMagnitude.MagnitudeType} ${info.EarthquakeMagnitude.MagnitudeValue}`,
  ];

  if (eq.Intensity?.ShakingArea && eq.Intensity.ShakingArea.length > 0) {
    const areas = eq.Intensity.ShakingArea
      .map((a) => `${a.CountyName}(${a.AreaIntensity})`)
      .join('、');
    parts.push(`  震度: ${areas}`);
  }

  parts.push(`  報告: ${eq.ReportContent}`);
  return parts.join('\n');
}

export async function getEarthquakeAlerts(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = (args.limit as number) ?? 5;
    const minMagnitude = args.minMagnitude as number | undefined;

    const [feltRecords, localRecords] = await Promise.all([
      fetchDataset<EarthquakeRecords>(env.CWA_API_KEY, DATASETS.EARTHQUAKE_FELT),
      fetchDataset<EarthquakeRecords>(env.CWA_API_KEY, DATASETS.EARTHQUAKE_LOCAL),
    ]);

    const feltQuakes = feltRecords.Earthquake ?? [];
    const localQuakes = localRecords.Earthquake ?? [];
    const merged = [...feltQuakes, ...localQuakes];

    const sorted = [...merged].sort((a, b) => {
      const timeA = a.EarthquakeInfo.OriginTime;
      const timeB = b.EarthquakeInfo.OriginTime;
      return timeB.localeCompare(timeA);
    });

    const filtered = minMagnitude != null
      ? sorted.filter(
          (eq) => eq.EarthquakeInfo.EarthquakeMagnitude.MagnitudeValue >= minMagnitude
        )
      : sorted;

    if (filtered.length === 0) {
      return {
        content: [{ type: 'text', text: '無符合條件的地震資料' }],
      };
    }

    const sliced = filtered.slice(0, limit);
    const lines = sliced.map(formatQuake);

    return { content: [{ type: 'text', text: lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得地震速報失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
