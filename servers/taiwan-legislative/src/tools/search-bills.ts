import { fetchLyApi, ENDPOINTS } from '../client.js';
import type { Env, ToolResult, BillRecord } from '../types.js';

export async function searchBills(
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

    const limit = (args.limit as number) ?? 20;
    const trimmedKeyword = keyword.trim();

    const { records, total } = await fetchLyApi<BillRecord>(ENDPOINTS.BILLS, {
      query: trimmedKeyword,
      limit,
      apiKey: env.LY_API_KEY,
    });

    if (!records || records.length === 0) {
      return {
        content: [
          { type: 'text', text: `搜尋「${trimmedKeyword}」查無相關法案` },
        ],
      };
    }

    const lines = records.map((r) => {
      return [
        `法案編號: ${r.billNo ?? '未知'}`,
        `  名稱: ${r.billName ?? '未知'}`,
        `  提案人: ${r.billProposer ?? '未知'}`,
        `  狀態: ${r.billStatus ?? '未知'}`,
        `  會期: ${r.sessionPeriod ?? '未知'}`,
      ].join('\n');
    });

    const header = `法案搜尋「${trimmedKeyword}」（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `搜尋法案失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
