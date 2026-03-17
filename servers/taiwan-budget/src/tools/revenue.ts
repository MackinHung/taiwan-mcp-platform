import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getRevenueBudget(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const year = args.year as string | undefined;
    const category = args.category as string | undefined;
    const limit = (args.limit as number) ?? 30;

    const filters: Record<string, string> = {};
    if (year) filters['年度'] = year;
    if (category) filters['科目名稱'] = category;

    const { records, total } = await fetchDataset(DATASETS.REVENUE, {
      limit,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    if (!records || records.length === 0) {
      const filterDesc = [
        year ? `年度「${year}」` : '',
        category ? `科目「${category}」` : '',
      ]
        .filter(Boolean)
        .join('、');
      return {
        content: [
          {
            type: 'text',
            text: filterDesc
              ? `查無符合條件的歲入預算資料（${filterDesc}）`
              : '查無歲入預算資料',
          },
        ],
      };
    }

    const lines = records.map((r) => {
      return [
        `年度: ${r['年度'] ?? '未知'}`,
        `  科目: ${r['科目名稱'] ?? r['歲入科目名稱'] ?? '未知'}`,
        `  預算數: ${r['預算數'] ?? '未知'}`,
        `  決算數: ${r['決算數'] ?? '未知'}`,
        `  比較增減: ${r['比較增減'] ?? '未知'}`,
      ].join('\n');
    });

    const header = `中央政府歲入預算（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得歲入預算失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
