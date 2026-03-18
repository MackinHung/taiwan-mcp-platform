import type { Env, ToolResult } from '../types.js';
import { lunarToSolar, getLeapMonth, getLunarMonthDays, getLeapMonthDays } from '../lunar-data.js';

export async function convertToSolar(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const lunarYear = args.lunarYear as number | undefined;
    const lunarMonth = args.lunarMonth as number | undefined;
    const lunarDay = args.lunarDay as number | undefined;
    const isLeapMonth = (args.isLeapMonth as boolean) ?? false;

    if (!lunarYear || !lunarMonth || !lunarDay) {
      return {
        content: [{ type: 'text', text: '請提供農曆年、月、日' }],
        isError: true,
      };
    }

    if (lunarYear < 1900 || lunarYear > 2100) {
      return {
        content: [{ type: 'text', text: '年份超出支援範圍（1900-2100）' }],
        isError: true,
      };
    }

    if (lunarMonth < 1 || lunarMonth > 12) {
      return {
        content: [{ type: 'text', text: '農曆月份應為 1-12' }],
        isError: true,
      };
    }

    // Validate leap month
    if (isLeapMonth) {
      const leapMonth = getLeapMonth(lunarYear);
      if (leapMonth !== lunarMonth) {
        return {
          content: [{
            type: 'text',
            text: `農曆 ${lunarYear} 年沒有閏${lunarMonth}月`,
          }],
          isError: true,
        };
      }
    }

    // Validate day within month
    const maxDays = isLeapMonth
      ? getLeapMonthDays(lunarYear)
      : getLunarMonthDays(lunarYear, lunarMonth);

    if (lunarDay < 1 || lunarDay > maxDays) {
      return {
        content: [{
          type: 'text',
          text: `農曆 ${lunarYear} 年${isLeapMonth ? '閏' : ''}${lunarMonth}月只有 ${maxDays} 天`,
        }],
        isError: true,
      };
    }

    const solar = lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeapMonth);
    const solarDate = `${solar.solarYear}-${String(solar.solarMonth).padStart(2, '0')}-${String(solar.solarDay).padStart(2, '0')}`;

    const result = {
      lunarYear,
      lunarMonth,
      lunarDay,
      isLeapMonth,
      solarDate,
      solarYear: solar.solarYear,
      solarMonth: solar.solarMonth,
      solarDay: solar.solarDay,
      message: `農曆 ${lunarYear} 年${isLeapMonth ? '閏' : ''}${lunarMonth}月${lunarDay}日 = 國曆 ${solarDate}`,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `農曆轉國曆失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
