import { fetchFireData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

interface GroupStats {
  count: number;
  deaths: number;
  injuries: number;
  propertyLoss: number;
}

export async function getFireStats(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;
    const groupBy = (args.groupBy as string) ?? 'county';

    if (groupBy !== 'county' && groupBy !== 'month') {
      return {
        content: [{ type: 'text', text: 'groupBy 參數須為 "county" 或 "month"' }],
        isError: true,
      };
    }

    const { records, total } = await fetchFireData({
      county: county?.trim() || undefined,
      limit: 1000,
    });

    if (records.length === 0) {
      const scope = county ? `${county}` : '全台';
      return {
        content: [{ type: 'text', text: `${scope}目前無火災統計資料` }],
      };
    }

    const groups = new Map<string, GroupStats>();

    for (const r of records) {
      const key = groupBy === 'county'
        ? r.county || '未知'
        : r.occurDate.substring(0, 7) || '未知';

      const existing = groups.get(key) ?? { count: 0, deaths: 0, injuries: 0, propertyLoss: 0 };
      groups.set(key, {
        count: existing.count + 1,
        deaths: existing.deaths + r.deathCount,
        injuries: existing.injuries + r.injuryCount,
        propertyLoss: existing.propertyLoss + r.propertyLoss,
      });
    }

    const sorted = [...groups.entries()].sort((a, b) => b[1].count - a[1].count);

    const lines = sorted.map(([key, stats]) =>
      [
        `${groupBy === 'county' ? '縣市' : '月份'}: ${key}`,
        `  火災件數: ${stats.count}`,
        `  死亡人數: ${stats.deaths}`,
        `  受傷人數: ${stats.injuries}`,
        `  財物損失: ${stats.propertyLoss.toLocaleString()} 元`,
      ].join('\n')
    );

    const scope = county ? `${county}` : '全台';
    const label = groupBy === 'county' ? '依縣市' : '依月份';
    const header = `${scope}火災統計（${label}分組，共 ${total} 筆資料）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得火災統計失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
