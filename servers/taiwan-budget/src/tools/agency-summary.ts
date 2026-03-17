import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getAgencyBudgetSummary(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const agency = args.agency as string | undefined;
    const limit = (args.limit as number) ?? 30;

    const filters: Record<string, string> = {};
    if (agency) filters['機關名稱'] = agency;

    const { records, total } = await fetchDataset(DATASETS.AGENCY_SUMMARY, {
      limit,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    if (!records || records.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: agency
              ? `查無機關「${agency}」的預算彙總資料`
              : '查無機關預算彙總資料',
          },
        ],
      };
    }

    const lines = records.map((r) => {
      return [
        `機關: ${r['機關名稱'] ?? '未知'}`,
        `  預算總額: ${r['預算數'] ?? r['預算總額'] ?? '未知'}`,
        `  人事費: ${r['人事費'] ?? '未知'}`,
        `  業務費: ${r['業務費'] ?? '未知'}`,
      ].join('\n');
    });

    const header = `各機關預算彙總（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得機關預算彙總失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
