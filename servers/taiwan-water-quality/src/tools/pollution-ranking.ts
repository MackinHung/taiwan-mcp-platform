import { fetchWaterQualityData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getPollutionRanking(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = (args.limit as number) ?? 20;

    const { records } = await fetchWaterQualityData({ limit: 1000 });

    if (records.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無河川水質資料可供排名' }],
      };
    }

    const sorted = [...records].sort((a, b) => b.rpiIndex - a.rpiIndex);
    const sliced = sorted.slice(0, limit);

    const lines = sliced.map((r, i) =>
      [
        `#${i + 1}  ${r.stationName}（${r.riverName}）`,
        `  縣市: ${r.county}  採樣日期: ${r.sampleDate}`,
        `  RPI: ${r.rpiIndex}  污染程度: ${r.pollutionLevel}`,
        `  pH: ${r.ph}  溶氧: ${r.dissolvedOxygen} mg/L  BOD: ${r.bod} mg/L`,
        `  氨氮: ${r.ammonia} mg/L  懸浮固體: ${r.suspendedSolids} mg/L`,
      ].join('\n')
    );

    const header = `河川污染排名（依 RPI 指數由高到低，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得污染排名失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
