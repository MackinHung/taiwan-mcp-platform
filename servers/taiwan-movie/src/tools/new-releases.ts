import { fetchMovieData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getNewReleases(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = (args.limit as number) ?? 20;

    const data = await fetchMovieData();

    // Sort by startDate descending (most recent first)
    const sorted = [...data]
      .filter((r) => r.startDate)
      .sort((a, b) => {
        const dateA = a.startDate ?? '';
        const dateB = b.startDate ?? '';
        return dateB.localeCompare(dateA);
      });

    if (sorted.length === 0) {
      return {
        content: [
          { type: 'text', text: '目前沒有電影/活動資料' },
        ],
      };
    }

    const sliced = sorted.slice(0, limit);
    const lines = sliced.map((r) =>
      [
        `活動名稱: ${r.title ?? '未知'}`,
        `  開始日期: ${r.startDate ?? '未知'}`,
        `  結束日期: ${r.endDate ?? '未知'}`,
        `  地點: ${r.location ?? '未知'}`,
        `  主辦單位: ${r.showUnit ?? '未知'}`,
      ].join('\n')
    );

    const header = `最新上映/即將上映活動（共 ${sorted.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得最新活動失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
