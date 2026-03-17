import type { Env, ToolResult, TraderRecord } from '../types.js';
import { fetchTraders } from '../client.js';

const TRADER_OID = '678DFEBC68102C72';

export async function lookupTrader(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string;
    if (!keyword) {
      return {
        content: [{ type: 'text', text: '請提供搜尋關鍵字（keyword 參數），可輸入統一編號或廠商名稱' }],
        isError: true,
      };
    }

    const records = await fetchTraders(TRADER_OID);

    const matched = records.filter(
      (r) => r.統一編號?.includes(keyword) || r.廠商名稱?.includes(keyword)
    );

    if (matched.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到符合「${keyword}」的廠商登記資料` }],
      };
    }

    const limited = matched.slice(0, 20);
    const lines = formatTraders(limited);

    const header = matched.length > 20
      ? `進出口廠商查詢結果（顯示前 20 筆，共 ${matched.length} 筆）`
      : `進出口廠商查詢結果（${matched.length} 筆）`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢廠商資料失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

function formatTraders(records: TraderRecord[]): string[] {
  return records.map((r) => {
    return [
      `廠商名稱: ${r.廠商名稱 ?? 'N/A'}`,
      `統一編號: ${r.統一編號 ?? 'N/A'}`,
      `地址: ${r.廠商地址 ?? 'N/A'}`,
      `電話: ${r.電話 ?? 'N/A'}`,
      `登記日期: ${r.登記日期 ?? 'N/A'}`,
      `營業項目: ${r.營業項目 ?? 'N/A'}`,
    ].join('\n');
  });
}
