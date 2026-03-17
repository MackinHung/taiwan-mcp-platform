import type { Env, ToolResult } from '../types.js';
import { fetchBusinessTaxCsv } from '../client.js';

const MAX_RESULTS = 20;

export async function lookupBusinessTax(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string;
    if (!keyword) {
      return {
        content: [{ type: 'text', text: '請提供統一編號或營業人名稱（keyword 參數）' }],
        isError: true,
      };
    }

    const records = await fetchBusinessTaxCsv(keyword);

    if (records.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到符合「${keyword}」的營業稅稅籍資料` }],
      };
    }

    const limited = records.slice(0, MAX_RESULTS);
    const lines: string[] = [];

    const header = records.length > MAX_RESULTS
      ? `營業稅稅籍查詢結果（顯示前 ${MAX_RESULTS} 筆，共 ${records.length} 筆）`
      : `營業稅稅籍查詢結果（${records.length} 筆）`;

    lines.push(header, '');

    for (const record of limited) {
      lines.push(
        `營業人名稱: ${record.營業人名稱 ?? 'N/A'}`,
        `統一編號: ${record.統一編號 ?? 'N/A'}`,
        `營業地址: ${record.營業地址 ?? 'N/A'}`,
        `負責人: ${record.負責人姓名 ?? 'N/A'}`,
        `資本額: ${record.資本額 ?? 'N/A'}`,
        `設立日期: ${record.設立日期 ?? 'N/A'}`,
        `營業狀態: ${record.營業狀態 ?? 'N/A'}`,
        `組織別: ${record.組織別名稱 ?? 'N/A'}`,
        '---',
      );
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢營業稅稅籍失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
