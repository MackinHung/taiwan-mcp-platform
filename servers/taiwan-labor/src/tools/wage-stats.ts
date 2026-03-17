import { fetchOpenData, RESOURCE_IDS } from '../client.js';
import type { Env, ToolResult, WageStatRecord } from '../types.js';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function formatWageRecord(record: WageStatRecord, index: number): string {
  const lines: string[] = [`${index + 1}.`];
  if (record.year) lines.push(`  年度: ${record.year}`);
  if (record.industry) lines.push(`  行業: ${record.industry}`);
  if (record.averageWage) lines.push(`  平均薪資: ${record.averageWage}`);
  if (record.medianWage) lines.push(`  中位數薪資: ${record.medianWage}`);
  return lines.join('\n');
}

export async function getWageStatistics(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const industry = args.industry as string | undefined;
    const year = args.year as string | undefined;
    const rawLimit = args.limit as number | undefined;
    const limit = Math.min(
      Math.max(1, rawLimit ?? DEFAULT_LIMIT),
      MAX_LIMIT
    );

    const params: Record<string, string> = {
      limit: String(limit),
    };
    if (industry) {
      params['filters[industry]'] = industry;
    }
    if (year) {
      params['filters[year]'] = year;
    }

    const records = await fetchOpenData<WageStatRecord>(
      RESOURCE_IDS.WAGE_STATISTICS,
      params
    );

    if (!records || records.length === 0) {
      const filterDesc = [
        industry ? `行業「${industry}」` : '',
        year ? `年度「${year}」` : '',
      ]
        .filter(Boolean)
        .join('、');
      return {
        content: [
          {
            type: 'text',
            text: filterDesc
              ? `查無${filterDesc}的薪資統計資料`
              : '查無薪資統計資料',
          },
        ],
      };
    }

    const lines: string[] = [
      '=== 薪資統計資料 ===',
      `共 ${records.length} 筆`,
      '',
    ];

    for (let i = 0; i < records.length; i++) {
      lines.push(formatWageRecord(records[i], i));
      lines.push('');
    }

    lines.push('資料來源: data.gov.tw 薪資統計');

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢薪資統計失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
