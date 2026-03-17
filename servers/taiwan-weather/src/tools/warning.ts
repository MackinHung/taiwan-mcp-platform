import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

interface WarningRecords {
  record: Array<{
    datasetDescription: string;
    hazardConditions: {
      hazards: {
        hazard: Array<{
          info: { phenomena: string; significance: string };
          validTime: { startTime: string; endTime: string };
          affectedAreas: {
            location: Array<{ locationName: string }>;
          };
        }>;
      };
    };
  }>;
}

export async function getWeatherWarning(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;

    const records = await fetchDataset<WarningRecords>(
      env.CWA_API_KEY,
      DATASETS.WARNING
    );

    const warnings = records.record ?? [];
    if (warnings.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無天氣警特報' }],
      };
    }

    const lines: string[] = [];
    for (const rec of warnings) {
      const hazards = rec.hazardConditions?.hazards?.hazard ?? [];
      for (const h of hazards) {
        const areas = h.affectedAreas?.location?.map((l) => l.locationName) ?? [];
        if (city && !areas.includes(city)) continue;

        lines.push(
          [
            `${h.info.phenomena}${h.info.significance}`,
            `  期間: ${h.validTime.startTime} ~ ${h.validTime.endTime}`,
            `  影響地區: ${areas.join('、')}`,
          ].join('\n')
        );
      }
    }

    if (lines.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: city
              ? `${city} 目前無天氣警特報`
              : '目前無天氣警特報',
          },
        ],
      };
    }

    return { content: [{ type: 'text', text: lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得天氣警特報失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
