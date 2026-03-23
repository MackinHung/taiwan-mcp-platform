import type { Env, ToolResult, FisheryRecord } from '../types.js';
import { fetchFisheryData } from '../client.js';

function formatRecord(r: FisheryRecord): string {
  return [
    `${r.speciesName}（${r.category}）`,
    `  產量: ${r.production.toLocaleString()} 公噸`,
    `  產值: ${r.value.toLocaleString()} 千元`,
    `  年度: ${r.year}`,
  ].join('\n');
}

function formatGrouped(records: FisheryRecord[]): string {
  const groups = new Map<string, { totalProduction: number; totalValue: number; count: number }>();
  for (const r of records) {
    const existing = groups.get(r.category) ?? { totalProduction: 0, totalValue: 0, count: 0 };
    groups.set(r.category, {
      totalProduction: existing.totalProduction + r.production,
      totalValue: existing.totalValue + r.value,
      count: existing.count + 1,
    });
  }
  const lines: string[] = ['漁業生產統計（依類別）', ''];
  for (const [category, stats] of groups) {
    lines.push(
      `${category}`,
      `  筆數: ${stats.count}`,
      `  總產量: ${stats.totalProduction.toLocaleString()} 公噸`,
      `  總產值: ${stats.totalValue.toLocaleString()} 千元`,
      ''
    );
  }
  return lines.join('\n');
}

export async function getFisheryProduction(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const category = args.category as string | undefined;
    const year = args.year as string | undefined;
    const limit = Math.min(Math.max((args.limit as number) || 20, 1), 100);

    const { records, total } = await fetchFisheryData({ category, limit });

    let filtered = records;
    if (year) {
      filtered = filtered.filter((r) => r.year === year);
    }

    if (filtered.length === 0) {
      const label = category ?? year ?? '全部';
      return {
        content: [{ type: 'text', text: `找不到 ${label} 的漁業生產資料` }],
      };
    }

    if (!category) {
      return {
        content: [{ type: 'text', text: formatGrouped(filtered) }],
      };
    }

    const lines = filtered.map(formatRecord);
    const header = `漁業生產統計 — ${category}${year ? ` (${year})` : ''}（共 ${total} 筆，顯示 ${filtered.length} 筆）`;
    return { content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得漁業生產資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
