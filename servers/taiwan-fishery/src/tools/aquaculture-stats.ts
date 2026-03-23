import type { Env, ToolResult, FisheryRecord } from '../types.js';
import { fetchFisheryData } from '../client.js';

function formatAquaculture(r: FisheryRecord): string {
  return [
    `${r.speciesName}`,
    `  養殖面積: ${r.aquacultureArea.toLocaleString()} 公頃`,
    `  產量: ${r.production.toLocaleString()} 公噸`,
    `  產值: ${r.value.toLocaleString()} 千元`,
    `  縣市: ${r.portCounty || '未分類'}`,
    `  年度: ${r.year}`,
  ].join('\n');
}

export async function getAquacultureStats(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;
    const limit = Math.min(Math.max((args.limit as number) || 20, 1), 100);

    const { records, total } = await fetchFisheryData({
      category: '養殖漁業',
      limit,
    });

    let filtered = records;
    if (county) {
      filtered = filtered.filter((r) => r.portCounty.includes(county));
    }

    if (filtered.length === 0) {
      const label = county ?? '全部';
      return {
        content: [{ type: 'text', text: `找不到 ${label} 的養殖漁業資料` }],
      };
    }

    const lines = filtered.map(formatAquaculture);
    const header = `養殖漁業統計${county ? ` — ${county}` : ''}（共 ${total} 筆，顯示 ${filtered.length} 筆）`;
    return { content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得養殖漁業資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
