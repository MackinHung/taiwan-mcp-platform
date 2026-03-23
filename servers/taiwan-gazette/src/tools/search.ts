import { searchGazette } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchGazetteTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    if (!keyword || keyword.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供搜尋關鍵字' }],
        isError: true,
      };
    }

    const chapter = args.chapter as string | undefined;
    const docType = args.doc_type as string | undefined;
    const startDate = args.start_date as string | undefined;
    const endDate = args.end_date as string | undefined;
    const page = (args.page as number) ?? 1;
    const pageSize = (args.page_size as number) ?? 10;

    const { results, total } = await searchGazette({
      keyword: keyword.trim(),
      chapter,
      docType,
      startDate,
      endDate,
      page,
      pageSize,
    });

    if (results.length === 0) {
      return {
        content: [
          { type: 'text', text: `搜尋「${keyword.trim()}」查無相關公報` },
        ],
      };
    }

    const lines = results.map((r) => {
      const parts = [`[${r.MetaId}] ${r.Title}`];
      if (r.PubGovName) parts.push(`  發布機關: ${r.PubGovName}`);
      if (r.Doc_Style_LName) parts.push(`  類型: ${r.Doc_Style_LName}`);
      if (r.Chapter) parts.push(`  篇別: ${r.Chapter}`);
      if (r.Date_Published) parts.push(`  發布日期: ${r.Date_Published}`);
      return parts.join('\n');
    });

    const header = `搜尋「${keyword.trim()}」共 ${total} 筆（第 ${page} 頁，顯示 ${results.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `搜尋公報失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
