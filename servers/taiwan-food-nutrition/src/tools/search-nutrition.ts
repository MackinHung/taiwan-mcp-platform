import { fetchFoodNutritionData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchFoodNutrition(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    if (!keyword || keyword.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供食品名稱關鍵字' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmed = keyword.trim();

    const data = await fetchFoodNutritionData(1000);
    const matched = data.filter(
      (r) =>
        (r['樣品名稱'] && r['樣品名稱'].includes(trimmed)) ||
        (r['俗名'] && r['俗名'].includes(trimmed))
    );

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無名稱含「${trimmed}」的食品` },
        ],
      };
    }

    const sliced = matched.slice(0, limit);
    const lines = sliced.map((r) =>
      [
        `食品名稱: ${r['樣品名稱'] ?? '未知'}`,
        `  俗名: ${r['俗名'] ?? '無'}`,
        `  食品分類: ${r['食品分類'] ?? '未知'}`,
        `  熱量: ${r['熱量'] ?? '未知'} kcal`,
        `  蛋白質: ${r['粗蛋白'] ?? '未知'} g`,
        `  脂肪: ${r['總脂肪'] ?? '未知'} g`,
        `  碳水化合物: ${r['碳水化合物'] ?? '未知'} g`,
      ].join('\n')
    );

    const header = `食品營養搜尋「${trimmed}」（共 ${matched.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋食品營養失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
