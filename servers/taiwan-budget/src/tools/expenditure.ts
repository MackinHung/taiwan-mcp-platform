import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getExpenditureBudget(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const agency = args.agency as string | undefined;
    const year = args.year as string | undefined;
    const limit = (args.limit as number) ?? 30;

    const filters: Record<string, string> = {};
    if (agency) filters['機關名稱'] = agency;
    if (year) filters['年度'] = year;

    const { records, total } = await fetchDataset(DATASETS.EXPENDITURE, {
      limit,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    if (!records || records.length === 0) {
      const filterDesc = [
        agency ? `機關「${agency}」` : '',
        year ? `年度「${year}」` : '',
      ]
        .filter(Boolean)
        .join('、');
      return {
        content: [
          {
            type: 'text',
            text: filterDesc
              ? `查無符合條件的歲出預算資料（${filterDesc}）`
              : '查無歲出預算資料',
          },
        ],
      };
    }

    const lines = records.map((r) => {
      return [
        `年度: ${r['年度'] ?? '未知'}`,
        `  機關: ${r['機關名稱'] ?? '未知'}`,
        `  科目: ${r['歲出科目名稱'] ?? r['科目名稱'] ?? '未知'}`,
        `  預算數: ${r['預算數'] ?? '未知'}`,
        `  決算數: ${r['決算數'] ?? '未知'}`,
      ].join('\n');
    });

    const header = `中央政府歲出預算（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得歲出預算失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
