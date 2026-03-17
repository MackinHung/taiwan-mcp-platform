import type { Env, ToolResult, TariffRecord } from '../types.js';
import { fetchTariffs } from '../client.js';

export async function lookupTariff(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string;
    if (!keyword) {
      return {
        content: [{ type: 'text', text: '請提供搜尋關鍵字（keyword 參數），可輸入稅則號別或貨品名稱' }],
        isError: true,
      };
    }

    const limit = Math.min(Math.max((args.limit as number) ?? 20, 1), 100);
    const records = await fetchTariffs();

    const matched = records.filter(
      (r) => r.稅則號別?.includes(keyword) || r.貨名?.includes(keyword)
    );

    if (matched.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到符合「${keyword}」的稅則資料` }],
      };
    }

    const limited = matched.slice(0, limit);
    const lines = formatTariffs(limited);

    const header = matched.length > limit
      ? `關稅稅則查詢結果（顯示前 ${limit} 筆，共 ${matched.length} 筆）`
      : `關稅稅則查詢結果（${matched.length} 筆）`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢稅則資料失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

function formatTariffs(records: TariffRecord[]): string[] {
  return records.map((r) => {
    return `${r.稅則號別 ?? 'N/A'} | ${r.貨名 ?? 'N/A'} | 稅率: ${r.稅率 ?? 'N/A'} | 單位: ${r.單位 ?? 'N/A'}`;
  });
}
