import { searchByCourt } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchCourtTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const court = args.court as string | undefined;
    if (!court || court.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供法院名稱' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmedCourt = court.trim();

    const { judgments, total } = await searchByCourt(trimmedCourt, limit);

    if (!judgments || judgments.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無「${trimmedCourt}」的裁判書資料` },
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

    const header = `「${trimmedCourt}」共找到 ${total} 筆裁判書（顯示 ${judgments.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `依法院搜尋裁判書失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
