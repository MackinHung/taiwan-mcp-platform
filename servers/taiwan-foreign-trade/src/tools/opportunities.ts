import { fetchTradePages, stripHtml, formatPublishTime } from '../client.js';
import type { Env, ToolResult } from '../types.js';

const NODE_ID = 45;

export async function searchGlobalBusinessOpportunitiesTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = (args.keyword as string | undefined)?.trim() ?? '';
    const region = (args.region as string | undefined)?.trim() ?? '';
    const limit = Math.min((args.limit as number) ?? 20, 100);

    const all = await fetchTradePages(NODE_ID);

    let filtered = all;

    if (keyword.length > 0) {
      filtered = filtered.filter(
        (p) =>
          p.PageTitle.includes(keyword) ||
          stripHtml(p.PageContent).includes(keyword)
      );
    }

    if (region.length > 0) {
      filtered = filtered.filter(
        (p) =>
          p.PageTitle.includes(region) ||
          stripHtml(p.PageContent).includes(region)
      );
    }

    const sorted = [...filtered].sort(
      (a, b) => b.PagePublishTime.localeCompare(a.PagePublishTime)
    );
    const page = sorted.slice(0, limit);

    if (page.length === 0) {
      const parts: string[] = [];
      if (keyword) parts.push(`關鍵字「${keyword}」`);
      if (region) parts.push(`地區「${region}」`);
      const filterDesc = parts.length > 0 ? parts.join('、') : '';
      const msg = filterDesc
        ? `搜尋${filterDesc}查無相關全球商機`
        : '目前無全球商機資料';
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

    const parts: string[] = [];
    if (keyword) parts.push(`關鍵字「${keyword}」`);
    if (region) parts.push(`地區「${region}」`);
    const filterDesc = parts.length > 0 ? `搜尋${parts.join('、')}` : '全球商機';

    const header = parts.length > 0
      ? `${filterDesc}共找到 ${filtered.length} 筆（顯示 ${page.length} 筆）`
      : `全球商機（共 ${all.length} 筆，顯示 ${page.length} 筆）`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得全球商機失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
