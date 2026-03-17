import type { Env, ToolResult } from '../types.js';

export async function getRecentPeriods(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const count = typeof args.count === 'number' ? args.count : 6;
    const clampedCount = Math.max(1, Math.min(count, 24));

    const periods = generateRecentPeriods(clampedCount);

    const lines = [
      `=== 最近 ${clampedCount} 期統一發票期別 ===`,
      '',
      ...periods.map((p) =>
        `${p.rocTerm} | ${p.startDate} ~ ${p.endDate}`
      ),
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得發票期別失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}

interface PeriodInfo {
  rocTerm: string;
  startDate: string;
  endDate: string;
}

export function generateRecentPeriods(count: number): PeriodInfo[] {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  // Round down to current even-month period
  if (month % 2 === 1) {
    month -= 1;
  }

  const periods: PeriodInfo[] = [];
  for (let i = 0; i < count; i++) {
    const rocYear = year - 1911;
    const prevMonth = month - 1;
    const rocTerm = `${rocYear}${String(month).padStart(2, '0')}`;
    const startDate = `${year}/${String(prevMonth).padStart(2, '0')}/01`;

    // End date: last day of the even month
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}/${String(month).padStart(2, '0')}/${lastDay}`;

    periods.push({ rocTerm, startDate, endDate });

    // Move to previous period (2 months back)
    month -= 2;
    if (month <= 0) {
      month += 12;
      year -= 1;
    }
  }

  return periods;
}
