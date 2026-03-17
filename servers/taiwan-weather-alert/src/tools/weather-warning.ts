import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult, WeatherWarningRecords } from '../types.js';

export async function getWeatherWarnings(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;

    const records = await fetchDataset<WeatherWarningRecords>(
      env.CWA_API_KEY,
      DATASETS.WEATHER_WARNING
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
        const areas =
          h.affectedAreas?.location?.map((l) => l.locationName) ?? [];
        if (city && !areas.includes(city)) continue;

        lines.push(
          [
            `警報類型: ${h.info.phenomena}${h.info.significance}`,
            `  影響地區: ${areas.join('、')}`,
            `  期間: ${h.validTime.startTime} ~ ${h.validTime.endTime}`,
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
