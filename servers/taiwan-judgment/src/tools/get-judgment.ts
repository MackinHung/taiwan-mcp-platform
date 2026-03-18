import { getJudgmentById } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getJudgmentTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const id = args.id as string | undefined;
    if (!id || id.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供裁判書案號' }],
        isError: true,
      };
    }

    const judgment = await getJudgmentById(id.trim());

    if (!judgment || !judgment.title) {
      return {
        content: [
          { type: 'text', text: `查無案號「${id}」的裁判書` },
        ],
      };
    }

    const lines = [
      `案號: ${judgment.caseNo ?? judgment.id}`,
      `法院: ${judgment.court ?? '未知'}`,
      `案件類型: ${judgment.caseType ?? '未知'}`,
      `日期: ${judgment.date ?? '未知'}`,
      `標題: ${judgment.title}`,
    ];

    if (judgment.judges && judgment.judges.length > 0) {
      lines.push(`法官: ${judgment.judges.join('、')}`);
    }

    if (judgment.parties && judgment.parties.length > 0) {
      lines.push(`當事人: ${judgment.parties.join('、')}`);
    }

    if (judgment.content) {
      const preview = judgment.content.length > 500
        ? judgment.content.substring(0, 500) + '...'
        : judgment.content;
      lines.push(`\n裁判內容:\n${preview}`);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得裁判書失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
