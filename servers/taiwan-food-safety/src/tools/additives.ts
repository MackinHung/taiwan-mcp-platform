import type { Env, ToolResult, FoodAdditive } from '../types.js';
import { fetchDataset, DATASETS } from '../client.js';

function formatAdditive(a: FoodAdditive): string {
  return [
    `品名: ${a.品名 ?? '未知'}`,
    `使用食品範圍及限量: ${a.使用食品範圍及限量 ?? '未知'}`,
    `使用限制: ${a.使用限制 ?? '無'}`,
  ].join('\n');
}

export async function searchFoodAdditives(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const name = args.name as string | undefined;
    const limit = (args.limit as number) ?? 20;

    const records = await fetchDataset<FoodAdditive>(
      DATASETS.FOOD_ADDITIVE,
      limit
    );

    let filtered = records;
    if (name) {
      filtered = filtered.filter((r) => (r.品名 ?? '').includes(name));
    }

    if (filtered.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: name
              ? `找不到與「${name}」相關的食品添加物資料`
              : '目前無食品添加物資料',
          },
        ],
      };
    }

    const header = name
      ? `食品添加物資料（搜尋: ${name}）— 共 ${filtered.length} 筆`
      : `食品添加物資料 — 共 ${filtered.length} 筆`;

    const lines = filtered.map(formatAdditive);
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢食品添加物資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
