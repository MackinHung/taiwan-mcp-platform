import type { Env, ToolResult, FoodViolation } from '../types.js';
import { fetchDataset, DATASETS } from '../client.js';

function formatViolation(v: FoodViolation): string {
  return [
    `公告日期: ${v.公告日期 ?? '未知'}`,
    `產品名稱: ${v.產品名稱 ?? '未知'}`,
    `違規廠商: ${v.違規廠商名稱 ?? '未知'}`,
    `違規原因: ${v.違規原因 ?? '未知'}`,
    `處辦情形: ${v.處辦情形 ?? '未知'}`,
    v.進口商名稱 ? `進口商: ${v.進口商名稱}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function getFoodViolations(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    const limit = (args.limit as number) ?? 20;

    const records = await fetchDataset<FoodViolation>(
      DATASETS.FOOD_VIOLATION,
      limit
    );

    let filtered = records;
    if (keyword) {
      filtered = filtered.filter(
        (r) =>
          (r.產品名稱 ?? '').includes(keyword) ||
          (r.違規廠商名稱 ?? '').includes(keyword)
      );
    }

    if (filtered.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: keyword
              ? `找不到與「${keyword}」相關的食品違規資料`
              : '目前無食品違規資料',
          },
        ],
      };
    }

    const header = keyword
      ? `食品違規資料（關鍵字: ${keyword}）— 共 ${filtered.length} 筆`
      : `食品違規資料 — 共 ${filtered.length} 筆`;

    const lines = filtered.map(formatViolation);
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢食品違規資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
