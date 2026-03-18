import { getRecentJudgments } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function recentJudgmentsTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const court = args.court as string | undefined;
    const limit = (args.limit as number) ?? 20;

    const { judgments, total } = await getRecentJudgments(
      court?.trim(),
      limit
    );

    if (!judgments || judgments.length === 0) {
      const courtDesc = court ? `「${court}」` : '';
      return {
        content: [
          { type: 'text', text: `查無${courtDesc}最新裁判書資料` },
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

    const courtDesc = court ? `「${court}」` : '';
    const header = `${courtDesc}最新裁判書（共 ${total} 筆，顯示 ${judgments.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得最新裁判書失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
