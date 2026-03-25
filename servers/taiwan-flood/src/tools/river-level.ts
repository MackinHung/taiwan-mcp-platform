import { fetchWraDataset, WRA_DATASETS } from '../client.js';
import type { Env, ToolResult, RiverWaterLevelRecord } from '../types.js';

function getWarningStatus(
  level: number,
  warn1: string,
  warn2: string,
  warn3: string
): string {
  const w1 = parseFloat(warn1);
  const w2 = parseFloat(warn2);
  const w3 = parseFloat(warn3);

  if (!isNaN(w3) && level >= w3) return '三級警戒';
  if (!isNaN(w2) && level >= w2) return '二級警戒';
  if (!isNaN(w1) && level >= w1) return '一級警戒';
  return '正常';
}

export async function getRiverWaterLevel(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const riverName = args.river_name as string | undefined;
    const stationName = args.station_name as string | undefined;

    const records = await fetchWraDataset<RiverWaterLevelRecord>(
      WRA_DATASETS.RIVER_LEVEL
    );

    let filtered = records;
    if (riverName) {
      filtered = filtered.filter((r) => r.RiverName?.includes(riverName));
    }
    if (stationName) {
      filtered = filtered.filter((r) => r.StationName?.includes(stationName));
    }

    if (filtered.length === 0) {
      const hint = riverName || stationName || '';
      return {
        content: [{ type: 'text', text: hint ? `找不到 ${hint} 的河川水位資料` : '無河川水位資料' }],
      };
    }

    const lines = filtered.slice(0, 20).map((r) => {
      const level = parseFloat(r.WaterLevel);
      const status = getWarningStatus(level, r.WarningLevel1, r.WarningLevel2, r.WarningLevel3);
      return [
        `${r.StationName}（${r.RiverName}）`,
        `  水位: ${r.WaterLevel} m`,
        `  警戒狀態: ${status}`,
        `  觀測時間: ${r.RecordTime}`,
      ].join('\n');
    });

    const header = `河川水位觀測（共 ${filtered.length} 站，顯示前 ${Math.min(filtered.length, 20)} 站）`;
    return { content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得河川水位資料失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
