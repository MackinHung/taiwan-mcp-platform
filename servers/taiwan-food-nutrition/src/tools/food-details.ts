import { fetchFoodNutritionData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getFoodDetails(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const name = args.name as string | undefined;
    if (!name || name.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供食品名稱' }],
        isError: true,
      };
    }

    const trimmed = name.trim();
    const data = await fetchFoodNutritionData(1000);
    const found = data.find(
      (r) => r['樣品名稱'] && r['樣品名稱'] === trimmed
    );

    if (!found) {
      return {
        content: [
          { type: 'text', text: `查無食品「${trimmed}」的營養資訊` },
        ],
      };
    }

    const lines = [
      `=== 食品完整營養資訊 ===`,
      `食品名稱: ${found['樣品名稱'] ?? '未知'}`,
      `俗名: ${found['俗名'] ?? '無'}`,
      `食品分類: ${found['食品分類'] ?? '未知'}`,
      `每單位重: ${found['每單位重'] ?? '未知'} g`,
      ``,
      `【熱量與三大營養素】`,
      `  熱量: ${found['熱量'] ?? '未知'} kcal`,
      `  粗蛋白: ${found['粗蛋白'] ?? '未知'} g`,
      `  總脂肪: ${found['總脂肪'] ?? '未知'} g`,
      `  飽和脂肪: ${found['飽和脂肪'] ?? '未知'} g`,
      `  碳水化合物: ${found['碳水化合物'] ?? '未知'} g`,
      `  糖: ${found['糖'] ?? '未知'} g`,
      `  膳食纖維: ${found['膳食纖維'] ?? '未知'} g`,
      ``,
      `【礦物質】`,
      `  鈉: ${found['鈉'] ?? '未知'} mg`,
      `  鈣: ${found['鈣'] ?? '未知'} mg`,
      `  鐵: ${found['鐵'] ?? '未知'} mg`,
      ``,
      `【維生素】`,
      `  維生素A: ${found['維生素A'] ?? '未知'} μg`,
      `  維生素C: ${found['維生素C'] ?? '未知'} mg`,
      `  維生素E: ${found['維生素E'] ?? '未知'} mg`,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得食品營養資訊失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
