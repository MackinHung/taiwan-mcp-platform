import { fetchMuseumData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchExhibitions(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    if (!keyword || keyword.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供展覽搜尋關鍵字' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmed = keyword.trim();

    const data = await fetchMuseumData();
    const matched = data.filter(
      (r) => r.title && r.title.includes(trimmed)
    );

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無標題含「${trimmed}」的展覽` },
        ],
      };
    }

    const sliced = matched.slice(0, limit);
    const lines = sliced.map((r) => {
      const venue = r.showInfo?.[0]?.locationName ?? r.showUnit ?? '未知';
      const desc = r.descriptionFilterHtml
        ? r.descriptionFilterHtml.substring(0, 80)
        : '無說明';
      return [
        `展覽: ${r.title ?? '未知'}`,
        `  場館: ${venue}`,
        `  期間: ${r.startDate ?? '未知'} ~ ${r.endDate ?? '未知'}`,
        `  說明: ${desc}`,
      ].join('\n');
    });

    const header = `展覽搜尋「${trimmed}」（共 ${matched.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋展覽失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
