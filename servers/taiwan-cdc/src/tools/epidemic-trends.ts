import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getEpidemicTrends(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const disease = args.disease as string | undefined;
    const region = args.region as string | undefined;
    const limit = (args.limit as number) ?? 30;

    const q = [
      disease ?? '',
      region ?? '',
    ].filter(Boolean).join(' ') || undefined;

    const { records, total } = await fetchDataset(DATASETS.EPIDEMIC_TRENDS, {
      limit,
      q,
    });

    if (!records || records.length === 0) {
      const filterDesc = [
        disease ? `疾病「${disease}」` : '',
        region ? `地區「${region}」` : '',
      ]
        .filter(Boolean)
        .join('、');
      return {
        content: [
          {
            type: 'text',
            text: filterDesc
              ? `查無符合條件的疫情趨勢資料（${filterDesc}）`
              : '查無疫情趨勢資料',
          },
        ],
      };
    }

    const lines = records.map((r) =>
      [
        `疾病: ${r['疾病名稱'] ?? r['disease_name'] ?? '未知'}`,
        `  年度: ${r['年度'] ?? r['year'] ?? '未知'}`,
        `  週別: ${r['週別'] ?? r['week'] ?? '未知'}`,
        `  地區: ${r['地區'] ?? r['region'] ?? '未知'}`,
        `  病例數: ${r['確定病例數'] ?? r['confirmed_cases'] ?? '未知'}`,
      ].join('\n')
    );

    const header = `疫情趨勢（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得疫情趨勢失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
