import { fetchAnnouncements } from '../client.js';
import type { Env, ToolResult } from '../types.js';

function formatDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}/${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(6, 8)}`;
}

export async function listAnnouncementsTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = Math.min((args.limit as number) ?? 20, 100);
    const offset = (args.offset as number) ?? 0;

    const all = await fetchAnnouncements();

    const sorted = [...all].sort((a, b) => b.SendDate.localeCompare(a.SendDate));
    const page = sorted.slice(offset, offset + limit);

    if (page.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無公告資料' }],
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

    const header = `政府公告（共 ${all.length} 筆，顯示第 ${offset + 1}-${offset + page.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得公告失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
