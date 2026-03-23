import { fetchAnnouncements } from '../client.js';
import type { Env, ToolResult } from '../types.js';

function formatDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}/${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(6, 8)}`;
}

export async function searchAnnouncementsTool(
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
    const trimmed = keyword.trim();

    const all = await fetchAnnouncements();
    const matched = all.filter((a) => a.Subject.includes(trimmed));
    const page = matched.slice(0, limit);

    if (page.length === 0) {
      return {
        content: [
          { type: 'text', text: `搜尋「${trimmed}」查無相關公告` },
        ],
      };
    }

    const lines = page.map((a) => {
      return [
        `[${a.Index}] ${a.Subject}`,
        `  發文機關: ${a.SendUnitName}`,
        `  發文字號: ${a.SendNo}`,
        `  發文日期: ${formatDate(a.SendDate)}`,
        `  截止日期: ${formatDate(a.DueDate)}`,
      ].join('\n');
    });

    const header = `搜尋「${trimmed}」共找到 ${matched.length} 筆公告（顯示 ${page.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `搜尋公告失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
