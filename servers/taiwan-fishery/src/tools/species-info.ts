import type { Env, ToolResult, FisheryRecord } from '../types.js';
import { fetchFisheryData } from '../client.js';

function formatSpeciesYear(r: FisheryRecord): string {
  return [
    `  ${r.year} | ${r.category}`,
    `    產量: ${r.production.toLocaleString()} 公噸`,
    `    產值: ${r.value.toLocaleString()} 千元`,
  ].join('\n');
}

export async function getSpeciesInfo(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const species = args.species as string;
    if (!species) {
      return {
        content: [{ type: 'text', text: '請提供魚種名稱（species 參數）' }],
        isError: true,
      };
    }

    const { records } = await fetchFisheryData({ limit: 1000 });
    const matched = records.filter((r) => r.speciesName.includes(species));

    if (matched.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到魚種「${species}」的相關資料` }],
      };
    }

    // Sort by year descending
    const sorted = [...matched].sort((a, b) => b.year.localeCompare(a.year));

    // Compute totals
    const totalProduction = sorted.reduce((sum, r) => sum + r.production, 0);
    const totalValue = sorted.reduce((sum, r) => sum + r.value, 0);
    const categories = [...new Set(sorted.map((r) => r.category))];

    const header = [
      `魚種資訊 — ${species}`,
      `涵蓋類別: ${categories.join('、')}`,
      `總產量: ${totalProduction.toLocaleString()} 公噸`,
      `總產值: ${totalValue.toLocaleString()} 千元`,
      `資料筆數: ${sorted.length}`,
      '',
      '歷年資料:',
    ].join('\n');

    const lines = sorted.map(formatSpeciesYear);
    return { content: [{ type: 'text', text: `${header}\n${lines.join('\n')}` }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `查詢魚種資訊失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
