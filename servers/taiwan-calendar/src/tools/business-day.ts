import { fetchHolidays } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function isBusinessDay(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const dateStr = args.date as string | undefined;

    if (!dateStr || dateStr.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供日期（YYYY-MM-DD 格式）' }],
        isError: true,
      };
    }

    const trimmed = dateStr.trim();
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!dateMatch) {
      return {
        content: [{ type: 'text', text: '日期格式錯誤，請使用 YYYY-MM-DD 格式' }],
        isError: true,
      };
    }

    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10);
    const day = parseInt(dateMatch[3], 10);
    const date = new Date(year, month - 1, day);

    // Validate the date is real
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return {
        content: [{ type: 'text', text: `日期 ${trimmed} 不是有效的日期` }],
        isError: true,
      };
    }

    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const dayName = dayNames[dayOfWeek];

    // Try to check against holiday API
    let isHoliday = false;
    let holidayName = '';
    let isMakeupWorkday = false;
    try {
      const { records } = await fetchHolidays(year);
      for (const r of records) {
        const recDate = r['西元日期'] ?? '';
        // Normalize both formats: "2026/1/1" and "2026-01-01"
        const normalizedRecDate = recDate.replace(/\//g, '-').replace(/-(\d)(?=-|$)/g, '-0$1');
        if (normalizedRecDate === trimmed) {
          if (r['是否放假'] === '是' || r['是否放假'] === '2') {
            isHoliday = true;
            holidayName = r['名稱'] ?? r['備註'] ?? '';
          } else {
            // 補上班日
            isMakeupWorkday = true;
          }
          break;
        }
      }
    } catch {
      // If API fails, we still use weekend check
    }

    const isWorkday = isMakeupWorkday || (!isWeekend && !isHoliday);

    const result = {
      date: trimmed,
      dayOfWeek: dayName,
      isWeekend,
      isHoliday,
      holidayName: holidayName || undefined,
      isMakeupWorkday,
      isBusinessDay: isWorkday,
      message: isWorkday
        ? `${trimmed}（${dayName}）是工作日${isMakeupWorkday ? '（補上班日）' : ''}`
        : `${trimmed}（${dayName}）不是工作日${isHoliday ? `（${holidayName}）` : '（週末）'}`,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `判斷工作日失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
