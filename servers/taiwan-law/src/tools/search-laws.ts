import { searchLaws } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchLawsTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    if (!keyword || keyword.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供搜尋關鍵字' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmedKeyword = keyword.trim();

    const { laws, total } = await searchLaws(trimmedKeyword, limit);

    if (!laws || laws.length === 0) {
      return {
        content: [
          { type: 'text', text: `搜尋「${trimmedKeyword}」查無相關法規` },
        ],
      };
    }

    const lines = laws.map((law) => {
      return [
        `法規名稱: ${law.LawName ?? '未知'}`,
        `  法規代碼: ${law.PCode ?? '未知'}`,
        `  法規位階: ${law.LawLevel ?? '未知'}`,
        `  最後修正日期: ${law.LawModifiedDate ?? '未知'}`,
      ].join('\n');
    });

    const header = `搜尋「${trimmedKeyword}」共找到 ${total} 筆法規（顯示 ${laws.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `搜尋法規失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
