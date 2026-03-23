import { fetchTradePages, stripHtml, formatPublishTime } from '../client.js';
import type { Env, ToolResult } from '../types.js';

const NODE_ID = 40;

export async function getTradeNewsTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = (args.keyword as string | undefined)?.trim() ?? '';
    const limit = Math.min((args.limit as number) ?? 20, 100);

    const all = await fetchTradePages(NODE_ID);

    const filtered = keyword.length > 0
      ? all.filter(
          (p) =>
            p.PageTitle.includes(keyword) ||
            stripHtml(p.PageContent).includes(keyword)
        )
      : all;

    const sorted = [...filtered].sort(
      (a, b) => b.PagePublishTime.localeCompare(a.PagePublishTime)
    );
    const page = sorted.slice(0, limit);

    if (page.length === 0) {
      const msg = keyword
        ? `搜尋「${keyword}」查無相關新聞稿`
        : '目前無新聞稿資料';
      return { content: [{ type: 'text', text: msg }] };
    }

    const lines = page.map((p) => {
      const summary = stripHtml(p.PageContent).slice(0, 120);
      return [
        `[${p.Id}] ${p.PageTitle}`,
        `  發布時間: ${formatPublishTime(p.PagePublishTime)}`,
        `  發布單位: ${p.department}`,
        `  摘要: ${summary}...`,
      ].join('\n');
    });

    const header = keyword
      ? `搜尋「${keyword}」共找到 ${filtered.length} 筆新聞稿（顯示 ${page.length} 筆）`
      : `貿易新聞稿（共 ${all.length} 筆，顯示 ${page.length} 筆）`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得新聞稿失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
