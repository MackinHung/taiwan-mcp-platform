import { fetchWaterQualityData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getStationData(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const stationName = args.stationName as string | undefined;
    if (!stationName || stationName.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供測站名稱' }],
        isError: true,
      };
    }

    const trimmed = stationName.trim();
    const { records } = await fetchWaterQualityData({ limit: 1000 });

    const matched = records.filter((r) =>
      r.stationName.includes(trimmed)
    );

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無測站「${trimmed}」的水質資料` },
        ],
      };
    }

    const lines = matched.map((r) =>
      [
        `=== ${r.stationName} ===`,
        `縣市: ${r.county}  河川: ${r.riverName}`,
        `採樣日期: ${r.sampleDate}`,
        `RPI: ${r.rpiIndex}  污染程度: ${r.pollutionLevel}`,
        ``,
        `【水質參數】`,
        `  pH: ${r.ph}`,
        `  溶氧量 (DO): ${r.dissolvedOxygen} mg/L`,
        `  生化需氧量 (BOD): ${r.bod} mg/L`,
        `  懸浮固體 (SS): ${r.suspendedSolids} mg/L`,
        `  氨氮 (NH3-N): ${r.ammonia} mg/L`,
        `  水溫: ${r.waterTemp} °C`,
      ].join('\n')
    );

    const header = `測站「${trimmed}」水質資料（共 ${matched.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得測站資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
