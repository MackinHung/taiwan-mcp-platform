import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getVaccinationInfo(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const vaccine = args.vaccine as string | undefined;
    const limit = (args.limit as number) ?? 30;

    const { records, total } = await fetchDataset(DATASETS.VACCINATION, {
      limit,
      q: vaccine || undefined,
    });

    if (!records || records.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: vaccine
              ? `查無疫苗「${vaccine}」的接種資訊`
              : '查無疫苗接種資訊',
          },
        ],
      };
    }

    const lines = records.map((r) =>
      [
        `疫苗: ${r['疫苗名稱'] ?? r['vaccine_name'] ?? '未知'}`,
        `  接種劑次: ${r['接種劑次'] ?? r['dose'] ?? '未知'}`,
        `  接種人數: ${r['接種人數'] ?? r['vaccinated_count'] ?? '未知'}`,
        `  涵蓋率: ${r['涵蓋率'] ?? r['coverage_rate'] ?? '未知'}`,
        `  適用對象: ${r['適用對象'] ?? r['target_group'] ?? '未知'}`,
      ].join('\n')
    );

    const header = `疫苗接種資訊（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得疫苗接種資訊失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
