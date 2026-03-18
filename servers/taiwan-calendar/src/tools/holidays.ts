import { fetchHolidays } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getHolidays(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const year = args.year as number | undefined;

    if (!year || typeof year !== 'number' || year < 1900 || year > 2100) {
      return {
        content: [{ type: 'text', text: '請提供有效的年度（1900-2100）' }],
        isError: true,
      };
    }

    const { records, total } = await fetchHolidays(year);

    if (!records || records.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `查無 ${year} 年度的國定假日資料`,
        }],
      };
    }

    // Filter to only actual holidays (isHoliday = "是")
    const holidays = records.filter((r) => r['是否放假'] === '是' || r['是否放假'] === '2');

    const lines = holidays.map((r) => {
      const date = r['西元日期'] ?? '未知';
      const name = r['名稱'] ?? r['備註'] ?? '未知';
      const category = r['假別'] ?? r['holidayCategory'] ?? '';
      return `${date} — ${name}${category ? ` (${category})` : ''}`;
    });

    const header = `${year} 年國定假日（共 ${holidays.length} 天）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得國定假日失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
