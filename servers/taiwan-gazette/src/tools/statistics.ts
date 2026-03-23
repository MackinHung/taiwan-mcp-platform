import type { Env, ToolResult } from '../types.js';

const CHAPTER_STATS = [
  { name: '綜合行政篇', count: 2959 },
  { name: '內政篇', count: 14253 },
  { name: '外交國防法務篇', count: 4387 },
  { name: '財政經濟篇', count: 34848 },
  { name: '教育科技文化篇', count: 16001 },
  { name: '交通建設篇', count: 42181 },
  { name: '農業環保篇', count: 22346 },
  { name: '衛生勞動篇', count: 21320 },
  { name: '附錄', count: 4282 },
];

export async function getGazetteStatisticsTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const total = CHAPTER_STATS.reduce((sum, ch) => sum + ch.count, 0);

    const lines = [
      `=== 行政院公報篇別統計 ===`,
      `公報總數: ${total.toLocaleString()} 筆`,
      ``,
      `--- 各篇別統計 ---`,
      ...CHAPTER_STATS.map(
        (ch) =>
          `  ${ch.name}: ${ch.count.toLocaleString()} 筆 (${((ch.count / total) * 100).toFixed(1)}%)`
      ),
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得公報統計失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
