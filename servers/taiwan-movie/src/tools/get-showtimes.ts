import { fetchMovieData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getShowtimes(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const title = args.title as string | undefined;
    if (!title || title.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供電影/活動名稱' }],
        isError: true,
      };
    }

    const trimmed = title.trim();
    const data = await fetchMovieData();
    const found = data.find(
      (r) => r.title && r.title.includes(trimmed)
    );

    if (!found) {
      return {
        content: [
          { type: 'text', text: `查無名稱含「${trimmed}」的電影/活動場次` },
        ],
      };
    }

    if (!found.showInfo || found.showInfo.length === 0) {
      return {
        content: [
          { type: 'text', text: `「${found.title}」目前沒有場次資訊` },
        ],
      };
    }

    const lines = found.showInfo.map((show, i) =>
      [
        `場次 ${i + 1}:`,
        `  時間: ${show.time ?? '未知'}`,
        `  地點: ${show.locationName ?? '未知'}`,
        `  地址: ${show.location ?? '未知'}`,
        `  票價: ${show.price ?? '未知'}`,
      ].join('\n')
    );

    const header = `「${found.title}」場次資訊（共 ${found.showInfo.length} 場）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得場次資訊失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
