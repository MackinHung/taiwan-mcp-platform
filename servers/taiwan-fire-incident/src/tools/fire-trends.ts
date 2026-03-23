import { fetchFireData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

interface MonthStats {
  count: number;
  deaths: number;
  injuries: number;
}

export async function getFireTrends(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;

    const { records, total } = await fetchFireData({
      county: county?.trim() || undefined,
      limit: 1000,
    });

    if (records.length === 0) {
      const scope = county ? `${county}` : '全台';
      return {
        content: [{ type: 'text', text: `${scope}目前無火災趨勢資料` }],
      };
    }

    const months = new Map<string, MonthStats>();

    for (const r of records) {
      const month = r.occurDate.substring(0, 7) || '未知';
      const existing = months.get(month) ?? { count: 0, deaths: 0, injuries: 0 };
      months.set(month, {
        count: existing.count + 1,
        deaths: existing.deaths + r.deathCount,
        injuries: existing.injuries + r.injuryCount,
      });
    }

    const sorted = [...months.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    const counts = sorted.map(([, s]) => s.count);
    let trend = '持平';
    if (counts.length >= 2) {
      const firstHalf = counts.slice(0, Math.floor(counts.length / 2));
      const secondHalf = counts.slice(Math.floor(counts.length / 2));
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      if (avgSecond > avgFirst * 1.1) {
        trend = '上升';
      } else if (avgSecond < avgFirst * 0.9) {
        trend = '下降';
      }
    }

    const lines = sorted.map(([month, stats]) =>
      `${month}: ${stats.count} 件（死亡 ${stats.deaths} / 受傷 ${stats.injuries}）`
    );

    const scope = county ? `${county}` : '全台';
    const header = [
      `=== ${scope}火災趨勢分析 ===`,
      `資料筆數: ${total}`,
      `統計月份數: ${sorted.length}`,
      `趨勢方向: ${trend}`,
    ].join('\n');

    return {
      content: [
        { type: 'text', text: `${header}\n\n--- 按月統計 ---\n${lines.join('\n')}` },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得火災趨勢失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
