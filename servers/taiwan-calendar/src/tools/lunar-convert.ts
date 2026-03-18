import type { Env, ToolResult } from '../types.js';
import { solarToLunar } from '../lunar-data.js';

export async function convertToLunar(
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

    if (year < 1900 || year > 2100) {
      return {
        content: [{ type: 'text', text: '年份超出支援範圍（1900-2100）' }],
        isError: true,
      };
    }

    // Validate date
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return {
        content: [{ type: 'text', text: `日期 ${trimmed} 不是有效的日期` }],
        isError: true,
      };
    }

    const lunar = solarToLunar(year, month, day);

    const result = {
      solarDate: trimmed,
      lunarYear: lunar.lunarYear,
      lunarMonth: lunar.lunarMonth,
      lunarDay: lunar.lunarDay,
      isLeapMonth: lunar.isLeapMonth,
      monthName: lunar.monthName,
      dayName: lunar.dayName,
      zodiac: lunar.zodiac,
      heavenlyStem: lunar.heavenlyStem,
      earthlyBranch: lunar.earthlyBranch,
      ganzhiYear: lunar.ganzhiYear,
      message: `國曆 ${trimmed} = 農曆 ${lunar.ganzhiYear}年（${lunar.zodiac}年）${lunar.monthName}${lunar.dayName}`,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `國曆轉農曆失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
