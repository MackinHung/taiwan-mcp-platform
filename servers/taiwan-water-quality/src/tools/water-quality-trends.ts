import { fetchWaterQualityData } from '../client.js';
import type { Env, ToolResult, WaterQualityRecord } from '../types.js';

export async function getWaterQualityTrends(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const riverName = args.riverName as string | undefined;
    const stationName = args.stationName as string | undefined;

    if (!riverName?.trim() && !stationName?.trim()) {
      return {
        content: [{
          type: 'text',
          text: '請提供 riverName 或 stationName 至少一個篩選條件',
        }],
        isError: true,
      };
    }

    const { records } = await fetchWaterQualityData({ limit: 1000 });

    let filtered: WaterQualityRecord[];
    let scope: string;

    if (stationName?.trim()) {
      const keyword = stationName.trim();
      filtered = records.filter((r) => r.stationName.includes(keyword));
      scope = `測站「${keyword}」`;
    } else {
      const keyword = riverName!.trim();
      filtered = records.filter((r) => r.riverName.includes(keyword));
      scope = `河川「${keyword}」`;
    }

    if (filtered.length === 0) {
      return {
        content: [{ type: 'text', text: `查無${scope}的水質趨勢資料` }],
      };
    }

    const sorted = [...filtered].sort((a, b) =>
      a.sampleDate.localeCompare(b.sampleDate)
    );

    const lines = sorted.map((r) =>
      `${r.sampleDate}  ${r.stationName}  RPI: ${r.rpiIndex}  DO: ${r.dissolvedOxygen} mg/L  BOD: ${r.bod} mg/L  污染: ${r.pollutionLevel}`
    );

    const firstRpi = sorted[0].rpiIndex;
    const lastRpi = sorted[sorted.length - 1].rpiIndex;
    const rpiChange = lastRpi - firstRpi;
    const absChange = Math.abs(rpiChange);

    let trendDirection: string;
    if (absChange < 0.5) {
      trendDirection = '持平';
    } else if (rpiChange > 0) {
      trendDirection = '惡化';
    } else {
      trendDirection = '改善';
    }

    const header = `${scope}水質趨勢分析（共 ${sorted.length} 筆）`;
    const summary = `RPI 變化: ${firstRpi.toFixed(1)} → ${lastRpi.toFixed(1)} (${rpiChange > 0 ? '+' : ''}${rpiChange.toFixed(1)})  趨勢: ${trendDirection}`;

    return {
      content: [{
        type: 'text',
        text: `${header}\n${summary}\n\n${lines.join('\n')}`,
      }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得水質趨勢失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
