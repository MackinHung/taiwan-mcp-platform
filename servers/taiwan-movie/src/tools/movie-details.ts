import { fetchMovieData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getMovieDetails(
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
          { type: 'text', text: `查無名稱含「${trimmed}」的電影/活動詳細資訊` },
        ],
      };
    }

    const showInfoLines = (found.showInfo ?? []).map((show, i) =>
      [
        `  場次 ${i + 1}:`,
        `    時間: ${show.time ?? '未知'}`,
        `    地點: ${show.locationName ?? '未知'}`,
        `    地址: ${show.location ?? '未知'}`,
        `    票價: ${show.price ?? '未知'}`,
      ].join('\n')
    );

    const lines = [
      `=== 電影/活動完整資訊 ===`,
      `活動名稱: ${found.title ?? '未知'}`,
      `分類: ${found.category ?? '未知'}`,
      ``,
      `【日期】`,
      `  開始日期: ${found.startDate ?? '未知'}`,
      `  結束日期: ${found.endDate ?? '未知'}`,
      ``,
      `【主辦資訊】`,
      `  主辦單位: ${found.showUnit ?? '未知'}`,
      `  指導單位: ${(found.masterUnit ?? []).join('、') || '未知'}`,
      `  地點: ${found.location ?? '未知'}`,
      ``,
      `【活動說明】`,
      `  ${found.descriptionFilterHtml ?? '無'}`,
      ``,
      `【場次資訊】`,
      ...(showInfoLines.length > 0 ? showInfoLines : ['  無場次資訊']),
      ``,
      `【連結】`,
      `  來源網址: ${found.sourceWebPromote ?? '無'}`,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得電影/活動詳細資訊失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
