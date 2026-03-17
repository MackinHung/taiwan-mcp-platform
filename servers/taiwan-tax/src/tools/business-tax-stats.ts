import type { Env, ToolResult } from '../types.js';
import { fetchOpenData } from '../client.js';

// data.gov.tw tax revenue statistics resource ID
export const TAX_STATS_RESOURCE_ID = '86984bc9-02e7-4b03-8e0c-8d2e61420db1';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function getTaxStatistics(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const year = args.year as string | undefined;
    const category = args.category as string | undefined;
    const rawLimit = args.limit as number | undefined;
    const limit = Math.min(Math.max(rawLimit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

    const params: Record<string, string> = {
      limit: String(limit),
    };

    if (year) {
      params['filters'] = JSON.stringify({ 年度: year });
    }

    const data = await fetchOpenData(TAX_STATS_RESOURCE_ID, params);
    let records = data.result.records;

    if (category) {
      records = records.filter((r) => {
        const taxCategory = r['稅目'] ?? r['稅別'] ?? r['類別'] ?? '';
        return taxCategory.includes(category);
      });
    }

    if (records.length === 0) {
      const filterDesc = [
        year ? `年度=${year}` : '',
        category ? `稅目=${category}` : '',
      ].filter(Boolean).join(', ');

      return {
        content: [{
          type: 'text',
          text: filterDesc
            ? `找不到符合條件的稅收統計資料（${filterDesc}）`
            : '找不到稅收統計資料',
        }],
      };
    }

    const lines: string[] = [
      `稅收統計資料（${records.length} 筆）`,
      '',
    ];

    for (const record of records) {
      const recordYear = record['年度'] ?? record['年別'] ?? 'N/A';
      const recordCategory = record['稅目'] ?? record['稅別'] ?? record['類別'] ?? 'N/A';
      const amount = record['金額'] ?? record['實徵數'] ?? record['稅收'] ?? 'N/A';

      lines.push(`年度: ${recordYear} | 稅目: ${recordCategory} | 金額: ${amount}`);
    }

    if (year || category) {
      lines.push('', '篩選條件:');
      if (year) lines.push(`  年度: ${year}`);
      if (category) lines.push(`  稅目: ${category}`);
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢稅收統計失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
