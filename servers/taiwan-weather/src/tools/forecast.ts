import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult, ForecastLocation } from '../types.js';

export async function getForecast36hr(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;
    const params: Record<string, string> = {};
    if (city) params.locationName = city;

    const records = await fetchDataset<{ location: ForecastLocation[] }>(
      env.CWA_API_KEY,
      DATASETS.FORECAST_36HR,
      params
    );

    if (!records.location || records.location.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: city
              ? `找不到 ${city} 的天氣資料`
              : '無可用天氣資料',
          },
        ],
      };
    }

    const lines = records.location.map((loc) => {
      const elements = loc.weatherElement
        .map((el) => {
          const latest = el.time[0];
          const value = latest?.elementValue?.[0]?.value ?? '無資料';
          return `  ${el.description || el.elementName}: ${value}`;
        })
        .join('\n');
      return `${loc.locationName}\n${elements}`;
    });

    return { content: [{ type: 'text', text: lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得天氣預報失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}

export async function getForecast7day(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;
    const params: Record<string, string> = {};
    if (city) params.locationName = city;

    const records = await fetchDataset<{ location: ForecastLocation[] }>(
      env.CWA_API_KEY,
      DATASETS.FORECAST_7DAY,
      params
    );

    if (!records.location || records.location.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: city
              ? `找不到 ${city} 的天氣資料`
              : '無可用天氣資料',
          },
        ],
      };
    }

    const lines = records.location.map((loc) => {
      const elements = loc.weatherElement
        .map((el) => {
          const latest = el.time[0];
          const value = latest?.elementValue?.[0]?.value ?? '無資料';
          return `  ${el.description || el.elementName}: ${value}`;
        })
        .join('\n');
      return `${loc.locationName}\n${elements}`;
    });

    return { content: [{ type: 'text', text: lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得 7 天預報失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
