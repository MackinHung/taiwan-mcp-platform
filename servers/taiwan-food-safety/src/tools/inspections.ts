import type { Env, ToolResult, HygieneInspection } from '../types.js';
import { fetchDataset, DATASETS } from '../client.js';

function formatInspection(i: HygieneInspection): string {
  return [
    `稽查日期: ${i.稽查日期 ?? '未知'}`,
    `業者名稱: ${i.業者名稱 ?? '未知'}`,
    `業者地址: ${i.業者地址 ?? '未知'}`,
    `稽查結果: ${i.稽查結果 ?? '未知'}`,
    i.不合格原因 ? `不合格原因: ${i.不合格原因}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function getHygieneInspections(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    const limit = (args.limit as number) ?? 20;

    const records = await fetchDataset<HygieneInspection>(
      DATASETS.HYGIENE_INSPECTION,
      limit
    );

    let filtered = records;
    if (keyword) {
      filtered = filtered.filter(
        (r) =>
          (r.業者名稱 ?? '').includes(keyword) ||
          (r.業者地址 ?? '').includes(keyword)
      );
    }

    if (filtered.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: keyword
              ? `找不到與「${keyword}」相關的餐飲衛生稽查資料`
              : '目前無餐飲衛生稽查資料',
          },
        ],
      };
    }

    const header = keyword
      ? `餐飲衛生稽查資料（關鍵字: ${keyword}）— 共 ${filtered.length} 筆`
      : `餐飲衛生稽查資料 — 共 ${filtered.length} 筆`;

    const lines = filtered.map(formatInspection);
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢餐飲衛生稽查資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
