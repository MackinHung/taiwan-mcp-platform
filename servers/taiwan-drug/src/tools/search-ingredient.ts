import { fetchDrugData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchByIngredient(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const ingredient = args.ingredient as string | undefined;
    if (!ingredient || ingredient.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供有效成分關鍵字' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmed = ingredient.trim().toLowerCase();

    const data = await fetchDrugData(1000);
    const matched = data.filter(
      (r) =>
        r['主成分略述'] &&
        r['主成分略述'].toLowerCase().includes(trimmed)
    );

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無含有成分「${ingredient.trim()}」的藥品` },
        ],
      };
    }

    const sliced = matched.slice(0, limit);
    const lines = sliced.map((r) =>
      [
        `許可證字號: ${r['許可證字號'] ?? '未知'}`,
        `  中文品名: ${r['中文品名'] ?? '未知'}`,
        `  主成分: ${r['主成分略述'] ?? '未知'}`,
        `  適應症: ${r['適應症'] ?? '未知'}`,
        `  製造商: ${r['製造商名稱'] ?? '未知'}`,
      ].join('\n')
    );

    const header = `成分搜尋「${ingredient.trim()}」（共 ${matched.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋成分失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
