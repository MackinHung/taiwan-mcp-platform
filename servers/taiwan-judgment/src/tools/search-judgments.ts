import { searchJudgments } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchJudgmentsTool(
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

    const { judgments, total } = await searchJudgments(trimmedKeyword, limit);

    if (!judgments || judgments.length === 0) {
      return {
        content: [
          { type: 'text', text: `搜尋「${trimmedKeyword}」查無相關裁判書` },
        ],
      };
    }

    const lines = judgments.map((j) => {
      return [
        `案號: ${j.caseNo ?? j.id ?? '未知'}`,
        `  法院: ${j.court ?? '未知'}`,
        `  案件類型: ${j.caseType ?? '未知'}`,
        `  日期: ${j.date ?? '未知'}`,
        `  標題: ${j.title ?? '未知'}`,
      ].join('\n');
    });

    const header = `搜尋「${trimmedKeyword}」共找到 ${total} 筆裁判書（顯示 ${judgments.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `搜尋裁判書失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
