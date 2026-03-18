import { fetchHolidays } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function countBusinessDays(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const startDateStr = args.startDate as string | undefined;
    const endDateStr = args.endDate as string | undefined;

    if (!startDateStr || startDateStr.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供起始日期（YYYY-MM-DD 格式）' }],
        isError: true,
      };
    }

    if (!endDateStr || endDateStr.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供結束日期（YYYY-MM-DD 格式）' }],
        isError: true,
      };
    }

    const startTrimmed = startDateStr.trim();
    const endTrimmed = endDateStr.trim();

    const startMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startTrimmed);
    const endMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endTrimmed);

    if (!startMatch || !endMatch) {
      return {
        content: [{ type: 'text', text: '日期格式錯誤，請使用 YYYY-MM-DD 格式' }],
        isError: true,
      };
    }

    const startDate = new Date(
      parseInt(startMatch[1], 10),
      parseInt(startMatch[2], 10) - 1,
      parseInt(startMatch[3], 10)
    );
    const endDate = new Date(
      parseInt(endMatch[1], 10),
      parseInt(endMatch[2], 10) - 1,
      parseInt(endMatch[3], 10)
    );

    if (startDate > endDate) {
      return {
        content: [{ type: 'text', text: '起始日期不能晚於結束日期' }],
        isError: true,
      };
    }

    // Collect holidays for all years in range
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const holidaySet = new Set<string>();
    const makeupWorkdaySet = new Set<string>();

    try {
      const years = [];
      for (let y = startYear; y <= endYear; y++) {
        years.push(y);
      }

      const results = await Promise.allSettled(years.map((y) => fetchHolidays(y)));
      for (const r of results) {
        if (r.status === 'fulfilled') {
          for (const rec of r.value.records) {
            const recDate = rec['西元日期'] ?? '';
            const normalizedDate = recDate.replace(/\//g, '-').replace(/-(\d)(?=-|$)/g, '-0$1');
            if (rec['是否放假'] === '是' || rec['是否放假'] === '2') {
              holidaySet.add(normalizedDate);
            } else {
              makeupWorkdaySet.add(normalizedDate);
            }
          }
        }
      }
    } catch {
      // If holiday API fails, rely on weekends only
    }

    let businessDays = 0;
    let totalDays = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      totalDays++;
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const dayOfWeek = current.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidaySet.has(dateStr);
      const isMakeupWorkday = makeupWorkdaySet.has(dateStr);

      if (isMakeupWorkday || (!isWeekend && !isHoliday)) {
        businessDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    const result = {
      startDate: startTrimmed,
      endDate: endTrimmed,
      totalDays,
      businessDays,
      nonBusinessDays: totalDays - businessDays,
      message: `${startTrimmed} 至 ${endTrimmed} 共 ${totalDays} 天，其中工作天 ${businessDays} 天、非工作天 ${totalDays - businessDays} 天`,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `計算工作天失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
