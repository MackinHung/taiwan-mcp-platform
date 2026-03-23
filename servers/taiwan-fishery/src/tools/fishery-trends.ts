import type { Env, ToolResult, FisheryRecord } from '../types.js';
import { fetchFisheryData } from '../client.js';

interface YearSummary {
  year: string;
  totalProduction: number;
  totalValue: number;
  count: number;
}

export async function getFisheryTrends(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const speciesName = args.speciesName as string | undefined;
    const category = args.category as string | undefined;

    const { records } = await fetchFisheryData({ category, limit: 1000 });

    let filtered = records;
    if (speciesName) {
      filtered = filtered.filter((r) => r.speciesName.includes(speciesName));
    }

    if (filtered.length === 0) {
      const label = speciesName ?? category ?? '全部';
      return {
        content: [{ type: 'text', text: `找不到 ${label} 的漁業趨勢資料` }],
      };
    }

    // Group by year
    const yearMap = new Map<string, YearSummary>();
    for (const r of filtered) {
      const existing = yearMap.get(r.year) ?? {
        year: r.year,
        totalProduction: 0,
        totalValue: 0,
        count: 0,
      };
      yearMap.set(r.year, {
        year: r.year,
        totalProduction: existing.totalProduction + r.production,
        totalValue: existing.totalValue + r.value,
        count: existing.count + 1,
      });
    }

    // Sort by year ascending
    const sorted = [...yearMap.values()].sort((a, b) =>
      a.year.localeCompare(b.year)
    );

    const filterLabel = [speciesName, category].filter(Boolean).join(' / ') || '全部漁業';
    const lines: string[] = [
      `漁業趨勢分析 — ${filterLabel}`,
      `涵蓋 ${sorted.length} 個年度`,
      '',
    ];

    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      let changeText = '';
      if (i > 0) {
        const prev = sorted[i - 1];
        const prodChange = prev.totalProduction > 0
          ? ((s.totalProduction - prev.totalProduction) / prev.totalProduction * 100).toFixed(1)
          : 'N/A';
        const valChange = prev.totalValue > 0
          ? ((s.totalValue - prev.totalValue) / prev.totalValue * 100).toFixed(1)
          : 'N/A';
        changeText = ` （產量 ${prodChange}%, 產值 ${valChange}%）`;
      }
      lines.push(
        `${s.year}:`,
        `  產量: ${s.totalProduction.toLocaleString()} 公噸${changeText ? '' : ''}`,
        `  產值: ${s.totalValue.toLocaleString()} 千元`,
        `  筆數: ${s.count}${changeText}`,
        ''
      );
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得漁業趨勢資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
