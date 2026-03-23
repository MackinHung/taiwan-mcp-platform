import { fetchRadiationData } from '../client.js';
import type { Env, ToolResult, RadiationRecord } from '../types.js';

export async function getRadiationSummary(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const { records, total } = await fetchRadiationData({ limit: 1000 });

    if (records.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無輻射監測資料可供統計' }],
      };
    }

    const values = records.map((r) => r.value);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    const maxStation = records.find((r) => r.value === max)!;
    const minStation = records.find((r) => r.value === min)!;

    // Group by county
    const byCounty = new Map<string, RadiationRecord[]>();
    for (const r of records) {
      const list = byCounty.get(r.county) ?? [];
      list.push(r);
      byCounty.set(r.county, list);
    }

    const countyLines = Array.from(byCounty.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([county, recs]) => {
        const countyValues = recs.map((r) => r.value);
        const countyAvg = countyValues.reduce((sum, v) => sum + v, 0) / countyValues.length;
        const countyMax = Math.max(...countyValues);
        return `  ${county}: 平均 ${countyAvg.toFixed(4)} μSv/h, 最高 ${countyMax.toFixed(4)} μSv/h (${recs.length} 站)`;
      });

    const alertCount = records.filter((r) => r.status !== '正常' || r.value > 0.2).length;

    const lines = [
      `=== 全台輻射監測統計摘要 ===`,
      `監測站總數: ${total}`,
      `取得資料筆數: ${records.length}`,
      ``,
      `【整體統計】`,
      `  平均值: ${avg.toFixed(4)} μSv/h`,
      `  最高值: ${max.toFixed(4)} μSv/h (${maxStation.stationName}, ${maxStation.county})`,
      `  最低值: ${min.toFixed(4)} μSv/h (${minStation.stationName}, ${minStation.county})`,
      `  異常/警戒站數: ${alertCount}`,
      ``,
      `【各縣市統計】`,
      ...countyLines,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得輻射統計摘要失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
