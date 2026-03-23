import { fetchWaterQualityData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getRiverQuality(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;
    const limit = (args.limit as number) ?? 20;

    const { records, total } = await fetchWaterQualityData({
      county: county?.trim() || undefined,
      limit: Math.min(limit, 100),
    });

    if (records.length === 0) {
      const scope = county ? county : '全台';
      return {
        content: [{ type: 'text', text: `${scope}目前無河川水質資料` }],
      };
    }

    const sliced = records.slice(0, limit);
    const lines = sliced.map((r) =>
      [
        `測站: ${r.stationName}`,
        `  縣市: ${r.county} / 河川: ${r.riverName}`,
        `  採樣日期: ${r.sampleDate}`,
        `  RPI: ${r.rpiIndex}  污染程度: ${r.pollutionLevel}`,
        `  pH: ${r.ph}  溶氧: ${r.dissolvedOxygen} mg/L  BOD: ${r.bod} mg/L`,
        `  懸浮固體: ${r.suspendedSolids} mg/L  氨氮: ${r.ammonia} mg/L`,
      ].join('\n')
    );

    const scope = county || '全台';
    const header = `${scope}河川水質監測（共 ${total} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得河川水質資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
