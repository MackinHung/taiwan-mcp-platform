import { getCategoryList, searchLaws } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchByCategoryTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const category = args.category as string | undefined;
    if (!category || category.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供法規分類名稱' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmedCategory = category.trim();

    // First get all categories to find matching ones
    const categories = await getCategoryList();
    const matchedCategories = categories.filter(
      (cat) => cat.CategoryName.includes(trimmedCategory)
    );

    if (matchedCategories.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無分類「${trimmedCategory}」，請確認分類名稱` },
        ],
      };
    }

    // Search laws using the category keyword
    const { laws, total } = await searchLaws(trimmedCategory, limit);

    if (!laws || laws.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `分類「${trimmedCategory}」下查無相關法規`,
          },
        ],
      };
    }

    const categoryNames = matchedCategories.map((c) => c.CategoryName).join('、');
    const lines = laws.map((law) => {
      return [
        `法規名稱: ${law.LawName ?? '未知'}`,
        `  法規代碼: ${law.PCode ?? '未知'}`,
        `  法規位階: ${law.LawLevel ?? '未知'}`,
        `  最後修正日期: ${law.LawModifiedDate ?? '未知'}`,
      ].join('\n');
    });

    const header = `分類「${categoryNames}」共找到 ${total} 筆法規（顯示 ${laws.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `依分類搜尋法規失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
