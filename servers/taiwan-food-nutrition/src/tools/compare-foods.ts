import { fetchFoodNutritionData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function compareFoods(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const foods = args.foods as string[] | undefined;
    if (!foods || !Array.isArray(foods) || foods.length < 2) {
      return {
        content: [{ type: 'text', text: '請提供至少 2 個食品名稱進行比較' }],
        isError: true,
      };
    }

    if (foods.length > 5) {
      return {
        content: [{ type: 'text', text: '最多比較 5 個食品' }],
        isError: true,
      };
    }

    const data = await fetchFoodNutritionData(1000);

    const foundFoods = foods.map((name) => {
      const trimmed = name.trim();
      const record = data.find(
        (r) => r['樣品名稱'] && r['樣品名稱'] === trimmed
      );
      return { name: trimmed, record };
    });

    const notFound = foundFoods.filter((f) => !f.record);
    if (notFound.length === foods.length) {
      return {
        content: [
          { type: 'text', text: `查無任何指定食品的營養資料` },
        ],
      };
    }

    const nutrients = [
      { label: '熱量 (kcal)', key: '熱量' },
      { label: '蛋白質 (g)', key: '粗蛋白' },
      { label: '總脂肪 (g)', key: '總脂肪' },
      { label: '碳水化合物 (g)', key: '碳水化合物' },
      { label: '膳食纖維 (g)', key: '膳食纖維' },
      { label: '鈉 (mg)', key: '鈉' },
    ] as const;

    const header = `=== 食品營養比較（每 100g） ===\n`;

    const nameRow = `${'營養素'.padEnd(16)}${foundFoods.map((f) => f.name.padEnd(12)).join('')}`;

    const rows = nutrients.map((n) => {
      const values = foundFoods.map((f) => {
        if (!f.record) return '(未找到)'.padEnd(12);
        const val = f.record[n.key as keyof typeof f.record] ?? '-';
        return String(val).padEnd(12);
      });
      return `${n.label.padEnd(16)}${values.join('')}`;
    });

    const warnings = notFound.length > 0
      ? `\n\n注意: 以下食品未找到 — ${notFound.map((f) => f.name).join('、')}`
      : '';

    return {
      content: [
        { type: 'text', text: `${header}${nameRow}\n${rows.join('\n')}${warnings}` },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `比較食品營養失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
