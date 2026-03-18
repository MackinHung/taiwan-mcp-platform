import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getDiseaseStatistics(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const disease = args.disease as string | undefined;
    const year = args.year as number | undefined;
    const limit = (args.limit as number) ?? 30;

    const q = [
      disease ?? '',
      year ? String(year) : '',
    ].filter(Boolean).join(' ') || undefined;

    const { records, total } = await fetchDataset(DATASETS.NOTIFIABLE_DISEASES, {
      limit,
      q,
    });

    if (!records || records.length === 0) {
      const filterDesc = [
        disease ? `疾病「${disease}」` : '',
        year ? `年度「${year}」` : '',
      ]
        .filter(Boolean)
        .join('、');
      return {
        content: [
          {
            type: 'text',
            text: filterDesc
              ? `查無符合條件的傳染病統計資料（${filterDesc}）`
              : '查無法定傳染病統計資料',
          },
        ],
      };
    }

    const lines = records.map((r) =>
      [
        `疾病: ${r['疾病名稱'] ?? r['disease_name'] ?? '未知'}`,
        `  年度: ${r['年度'] ?? r['year'] ?? '未知'}`,
        `  通報數: ${r['通報病例數'] ?? r['reported_cases'] ?? '未知'}`,
        `  確定數: ${r['確定病例數'] ?? r['confirmed_cases'] ?? '未知'}`,
        `  地區: ${r['地區'] ?? r['region'] ?? '未知'}`,
      ].join('\n')
    );

    const header = `法定傳染病統計（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得傳染病統計失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
