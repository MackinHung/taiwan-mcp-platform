import { getLawHistory } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getHistoryTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const pcode = args.pcode as string | undefined;
    if (!pcode || pcode.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供法規代碼（PCode）' }],
        isError: true,
      };
    }

    const history = await getLawHistory(pcode.trim());

    if (!history || !history.LawName) {
      return {
        content: [
          { type: 'text', text: `查無法規代碼「${pcode}」的沿革資料` },
        ],
      };
    }

    const lines = [
      `法規名稱: ${history.LawName}`,
      `法規代碼: ${history.PCode}`,
      `最後修正日期: ${history.LawModifiedDate ?? '未知'}`,
    ];

    if (history.LawHistories) {
      lines.push(`\n沿革:\n${history.LawHistories}`);
    } else {
      lines.push('\n無沿革資料');
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得法規沿革失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
