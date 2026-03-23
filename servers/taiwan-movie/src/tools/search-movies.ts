import { fetchMovieData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchMovies(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    if (!keyword || keyword.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供電影/活動名稱關鍵字' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmed = keyword.trim();

    const data = await fetchMovieData();
    const matched = data.filter(
      (r) => r.title && r.title.includes(trimmed)
    );

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無名稱含「${trimmed}」的電影/活動` },
        ],
      };
    }

    const sliced = matched.slice(0, limit);
    const lines = sliced.map((r) =>
      [
        `活動名稱: ${r.title ?? '未知'}`,
        `  日期: ${r.startDate ?? '未知'} ~ ${r.endDate ?? '未知'}`,
        `  地點: ${r.location ?? '未知'}`,
        `  主辦單位: ${r.showUnit ?? '未知'}`,
      ].join('\n')
    );

    const header = `電影/活動搜尋「${trimmed}」（共 ${matched.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋電影/活動失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
