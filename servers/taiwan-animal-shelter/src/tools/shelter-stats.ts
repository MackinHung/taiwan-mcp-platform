import { fetchAnimalData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getShelterStats(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const shelterName = args.shelterName as string | undefined;
    const { records } = await fetchAnimalData({ limit: 1000 });

    let filtered = records;
    if (shelterName && shelterName.trim()) {
      const name = shelterName.trim();
      filtered = records.filter((r) => r.shelterName && r.shelterName.includes(name));
    }

    if (filtered.length === 0) {
      const msg = shelterName
        ? `查無「${shelterName.trim()}」收容所的統計資料`
        : '目前無收容所統計資料';
      return {
        content: [{ type: 'text', text: msg }],
      };
    }

    const statusCounts: Record<string, number> = {};
    const speciesCounts: Record<string, number> = {};
    const sizeCounts: Record<string, number> = {};

    for (const r of filtered) {
      const status = r.status || '未知';
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;

      const species = r.species || '未知';
      speciesCounts[species] = (speciesCounts[species] ?? 0) + 1;

      const size = r.bodySize || '未知';
      sizeCounts[size] = (sizeCounts[size] ?? 0) + 1;
    }

    const statusMap: Record<string, string> = {
      OPEN: '開放領養',
      ADOPTED: '已領養',
      DEAD: '死亡',
      OTHER: '其他',
    };

    const title = shelterName
      ? `「${shelterName.trim()}」收容所統計`
      : '全部收容所統計';

    const lines = [
      `=== ${title} ===`,
      `動物總數: ${filtered.length}`,
      '',
      '--- 依狀態 ---',
      ...Object.entries(statusCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `  ${statusMap[k] || k}: ${v}`),
      '',
      '--- 依種類 ---',
      ...Object.entries(speciesCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `  ${k}: ${v}`),
      '',
      '--- 依體型 ---',
      ...Object.entries(sizeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `  ${k}: ${v}`),
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得收容所統計失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
