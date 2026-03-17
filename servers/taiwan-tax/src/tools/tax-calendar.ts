import type { Env, ToolResult } from '../types.js';

interface TaxDeadline {
  month: number;
  items: string[];
}

export const TAX_CALENDAR: TaxDeadline[] = [
  { month: 1, items: ['使用牌照稅（自用車輛）繳納'] },
  { month: 3, items: ['營業稅申報（1-2月）'] },
  { month: 5, items: [
    '綜合所得稅年度申報',
    '營利事業所得稅年度申報',
    '房屋稅繳納',
    '營業稅申報（3-4月）',
  ]},
  { month: 7, items: ['營業稅申報（5-6月）'] },
  { month: 9, items: ['營業稅申報（7-8月）'] },
  { month: 11, items: [
    '營業稅申報（9-10月）',
    '地價稅繳納',
  ]},
];

function getDeadlinesForMonth(month: number): TaxDeadline | undefined {
  return TAX_CALENDAR.find((d) => d.month === month);
}

function getUpcomingDeadlines(currentMonth: number): TaxDeadline[] {
  const upcoming: TaxDeadline[] = [];
  const sorted = [...TAX_CALENDAR].sort((a, b) => a.month - b.month);

  for (const deadline of sorted) {
    if (deadline.month > currentMonth && upcoming.length < 3) {
      upcoming.push(deadline);
    }
  }

  if (upcoming.length < 3) {
    for (const deadline of sorted) {
      if (deadline.month <= currentMonth && upcoming.length < 3) {
        upcoming.push({ ...deadline, month: deadline.month });
      }
    }
  }

  return upcoming;
}

function formatMonth(month: number): string {
  return `${month} 月`;
}

export async function getTaxCalendar(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const rawMonth = args.month as number | undefined;
    const currentMonth = rawMonth ?? new Date().getMonth() + 1;

    if (currentMonth < 1 || currentMonth > 12) {
      return {
        content: [{ type: 'text', text: '月份必須介於 1-12 之間' }],
        isError: true,
      };
    }

    const lines: string[] = [
      `報稅行事曆 — ${formatMonth(currentMonth)}`,
      '',
    ];

    const currentDeadline = getDeadlinesForMonth(currentMonth);
    if (currentDeadline) {
      lines.push(`本月（${formatMonth(currentMonth)}）申報項目:`);
      for (const item of currentDeadline.items) {
        lines.push(`  - ${item}`);
      }
    } else {
      lines.push(`本月（${formatMonth(currentMonth)}）無重大稅務申報期限`);
    }

    const upcoming = getUpcomingDeadlines(currentMonth);
    if (upcoming.length > 0) {
      lines.push('', '即將到來的申報期限:');
      for (const deadline of upcoming) {
        lines.push(`  ${formatMonth(deadline.month)}:`);
        for (const item of deadline.items) {
          lines.push(`    - ${item}`);
        }
      }
    }

    lines.push(
      '',
      '提醒: 各稅目實際申報期限請以財政部公告為準',
    );

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得報稅行事曆失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
