import { fetchAnnouncements } from '../client.js';
import type { Env, ToolResult, Announcement } from '../types.js';

function formatDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}/${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(6, 8)}`;
}

function getDateField(a: Announcement, field: string): string {
  switch (field) {
    case 'doc':
      return a.DocDate;
    case 'due':
      return a.DueDate;
    default:
      return a.SendDate;
  }
}

export async function getAnnouncementsByDateTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const startDate = args.start_date as string | undefined;
    const endDate = args.end_date as string | undefined;
    const dateField = (args.date_field as string) ?? 'send';
    const limit = (args.limit as number) ?? 20;

    if (!startDate && !endDate) {
      return {
        content: [{ type: 'text', text: '請提供起始日期或結束日期（格式 YYYYMMDD）' }],
        isError: true,
      };
    }

    const all = await fetchAnnouncements();
    const matched = all.filter((a) => {
      const dateValue = getDateField(a, dateField);
      if (startDate && dateValue < startDate) return false;
      if (endDate && dateValue > endDate) return false;
      return true;
    });

    const page = matched.slice(0, limit);

    if (page.length === 0) {
      const rangeDesc = [
        startDate ? `從 ${formatDate(startDate)}` : '',
        endDate ? `至 ${formatDate(endDate)}` : '',
      ]
        .filter(Boolean)
        .join(' ');
      return {
        content: [
          { type: 'text', text: `${rangeDesc} 查無相關公告` },
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

    const fieldLabel =
      dateField === 'doc' ? '登載日期' : dateField === 'due' ? '截止日期' : '發文日期';
    const rangeDesc = [
      startDate ? `從 ${formatDate(startDate)}` : '',
      endDate ? `至 ${formatDate(endDate)}` : '',
    ]
      .filter(Boolean)
      .join(' ');
    const header = `依${fieldLabel} ${rangeDesc} 共找到 ${matched.length} 筆公告（顯示 ${page.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `篩選日期公告失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
