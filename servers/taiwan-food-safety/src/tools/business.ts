import type { Env, ToolResult, FoodBusiness } from '../types.js';
import { fetchDataset, DATASETS } from '../client.js';

function formatBusiness(b: FoodBusiness): string {
  return [
    `業者名稱: ${b.公司或商業登記名稱 ?? '未知'}`,
    `統一編號: ${b.公司統一編號 ?? '未知'}`,
    `地址: ${b.業者地址 ?? '未知'}`,
    `登錄項目: ${b.登錄項目 ?? '未知'}`,
  ].join('\n');
}

export async function searchFoodBusiness(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const name = args.name as string | undefined;
    const limit = (args.limit as number) ?? 20;

    const records = await fetchDataset<FoodBusiness>(
      DATASETS.FOOD_BUSINESS,
      limit
    );

    let filtered = records;
    if (name) {
      filtered = filtered.filter((r) =>
        (r.公司或商業登記名稱 ?? '').includes(name)
      );
    }

    if (filtered.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: name
              ? `找不到與「${name}」相關的食品業者資料`
              : '目前無食品業者登錄資料',
          },
        ],
      };
    }

    const header = name
      ? `食品業者登錄資料（搜尋: ${name}）— 共 ${filtered.length} 筆`
      : `食品業者登錄資料 — 共 ${filtered.length} 筆`;

    const lines = filtered.map(formatBusiness);
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢食品業者資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
