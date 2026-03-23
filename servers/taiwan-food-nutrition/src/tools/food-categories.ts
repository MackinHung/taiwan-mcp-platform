import { fetchFoodNutritionData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getFoodCategories(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const category = args.category as string | undefined;
    const data = await fetchFoodNutritionData(1000);

    if (category && category.trim().length > 0) {
      const trimmed = category.trim();
      const filtered = data.filter(
        (r) => r['食品分類'] && r['食品分類'] === trimmed
      );

      if (filtered.length === 0) {
        return {
          content: [
            { type: 'text', text: `查無分類「${trimmed}」的食品` },
          ],
        };
      }

      const lines = filtered.map((r) =>
        `  - ${r['樣品名稱'] ?? '未知'} (熱量: ${r['熱量'] ?? '未知'} kcal)`
      );

      return {
        content: [
          {
            type: 'text',
            text: `分類「${trimmed}」共 ${filtered.length} 項食品\n\n${lines.join('\n')}`,
          },
        ],
      };
    }

    // No category specified: list all categories with counts
    const categoryMap = new Map<string, number>();
    for (const r of data) {
      const cat = r['食品分類'] ?? '未分類';
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
    }

    const entries = [...categoryMap.entries()].sort((a, b) => b[1] - a[1]);
    const lines = entries.map(
      ([cat, count]) => `  ${cat}: ${count} 項`
    );

    const header = `食品分類列表（共 ${entries.length} 個分類，${data.length} 項食品）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得食品分類失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
