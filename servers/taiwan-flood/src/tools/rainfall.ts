import { fetchWraDataset, WRA_DATASETS } from '../client.js';
import type { Env, ToolResult, RainfallRecord } from '../types.js';

export async function getRainfallData(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;
    const stationName = args.station_name as string | undefined;

    const records = await fetchWraDataset<RainfallRecord>(WRA_DATASETS.RAINFALL);

    let filtered = records;
    if (city) {
      filtered = filtered.filter((r) => r.CityName?.includes(city));
    }
    if (stationName) {
      filtered = filtered.filter((r) => r.StationName?.includes(stationName));
    }

    if (filtered.length === 0) {
      const hint = city || stationName || '';
      return {
        content: [{ type: 'text', text: hint ? `找不到 ${hint} 的雨量資料` : '無雨量觀測資料' }],
      };
    }

    const lines = filtered.slice(0, 20).map((r) =>
      [
        `${r.StationName}（${r.CityName}）`,
        `  10 分鐘雨量: ${r.Rainfall10min} mm`,
        `  1 小時雨量: ${r.Rainfall1hr} mm`,
        `  3 小時雨量: ${r.Rainfall3hr} mm`,
        `  6 小時雨量: ${r.Rainfall6hr} mm`,
        `  12 小時雨量: ${r.Rainfall12hr} mm`,
        `  24 小時雨量: ${r.Rainfall24hr} mm`,
        `  觀測時間: ${r.RecordTime}`,
      ].join('\n')
    );

    const header = `雨量觀測資料（共 ${filtered.length} 站，顯示前 ${Math.min(filtered.length, 20)} 站）`;
    return { content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得雨量資料失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
