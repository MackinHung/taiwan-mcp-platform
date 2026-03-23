import { fetchFoodNutritionData } from '../client.js';
import type { Env, ToolResult, FoodNutritionRecord } from '../types.js';

const NUTRIENT_MAP: Record<string, keyof FoodNutritionRecord> = {
  '熱量': '熱量',
  '蛋白質': '粗蛋白',
  '粗蛋白': '粗蛋白',
  '脂肪': '總脂肪',
  '總脂肪': '總脂肪',
  '飽和脂肪': '飽和脂肪',
  '碳水化合物': '碳水化合物',
  '糖': '糖',
  '膳食纖維': '膳食纖維',
  '鈉': '鈉',
  '鈣': '鈣',
  '鐵': '鐵',
  '維生素A': '維生素A',
  '維生素C': '維生素C',
  '維生素E': '維生素E',
};

export async function searchByNutrient(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const nutrient = args.nutrient as string | undefined;
    if (!nutrient || nutrient.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供營養素名稱' }],
        isError: true,
      };
    }

    const minValue = args.minValue as number | undefined;
    if (minValue === undefined || minValue === null) {
      return {
        content: [{ type: 'text', text: '請提供最小值 (minValue)' }],
        isError: true,
      };
    }

    const maxValue = args.maxValue as number | undefined;
    const limit = (args.limit as number) ?? 20;
    const trimmedNutrient = nutrient.trim();

    const fieldKey = NUTRIENT_MAP[trimmedNutrient];
    if (!fieldKey) {
      const available = Object.keys(NUTRIENT_MAP).join('、');
      return {
        content: [
          { type: 'text', text: `不支援的營養素「${trimmedNutrient}」。可用營養素: ${available}` },
        ],
        isError: true,
      };
    }

    const data = await fetchFoodNutritionData(1000);

    const matched = data.filter((r) => {
      const rawValue = r[fieldKey];
      if (!rawValue) return false;
      const numValue = parseFloat(rawValue);
      if (isNaN(numValue)) return false;
      if (numValue < minValue) return false;
      if (maxValue !== undefined && numValue > maxValue) return false;
      return true;
    });

    if (matched.length === 0) {
      const rangeText = maxValue !== undefined
        ? `${minValue}~${maxValue}`
        : `>= ${minValue}`;
      return {
        content: [
          { type: 'text', text: `查無${trimmedNutrient}含量在 ${rangeText} 範圍的食品` },
        ],
      };
    }

    // Sort descending by nutrient value
    const sorted = [...matched].sort((a, b) => {
      const va = parseFloat(a[fieldKey] ?? '0');
      const vb = parseFloat(b[fieldKey] ?? '0');
      return vb - va;
    });

    const sliced = sorted.slice(0, limit);
    const lines = sliced.map((r) =>
      [
        `食品名稱: ${r['樣品名稱'] ?? '未知'}`,
        `  食品分類: ${r['食品分類'] ?? '未知'}`,
        `  ${trimmedNutrient}: ${r[fieldKey] ?? '未知'}`,
      ].join('\n')
    );

    const rangeText = maxValue !== undefined
      ? `${minValue}~${maxValue}`
      : `>= ${minValue}`;
    const header = `${trimmedNutrient}含量 ${rangeText} 的食品（共 ${matched.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `依營養素搜尋失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
