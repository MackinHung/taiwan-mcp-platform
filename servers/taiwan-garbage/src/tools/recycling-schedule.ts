import { fetchSchedule, isValidCity, getCityLabel } from '../client.js';
import type { Env, ToolResult, SupportedCity } from '../types.js';

// Recycling days: typically Mon, Wed, Fri or Tue, Thu, Sat depending on city
const RECYCLING_DAY_KEYWORDS = ['一', '三', '五', '二', '四', '六', '資源回收'];

export async function getRecyclingSchedule(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;
    const district = args.district as string | undefined;

    if (!city || typeof city !== 'string') {
      return {
        content: [{ type: 'text', text: '請提供城市代碼（如 taipei, tainan, new_taipei, taoyuan, kaohsiung, taichung）' }],
        isError: true,
      };
    }

    if (!isValidCity(city)) {
      return {
        content: [{ type: 'text', text: `不支援的城市: ${city}。支援的城市: taipei, tainan, new_taipei, taoyuan, kaohsiung, taichung` }],
        isError: true,
      };
    }

    const schedules = await fetchSchedule(city as SupportedCity, district);

    // Filter for recycling-related schedules
    // In Taiwan, recycling trucks usually follow a different day pattern
    // We look for routes containing recycling keywords or specific days
    const recyclingSchedules = schedules.filter((s) => {
      const combined = `${s.route} ${s.scheduleDay} ${s.address}`.toLowerCase();
      return combined.includes('資源回收') ||
        combined.includes('回收') ||
        combined.includes('recycl');
    });

    // If no specific recycling-tagged routes, show all schedules with a note
    const displaySchedules = recyclingSchedules.length > 0 ? recyclingSchedules : schedules;
    const isFiltered = recyclingSchedules.length > 0;

    if (displaySchedules.length === 0) {
      const districtMsg = district ? `${district}區` : '';
      return {
        content: [{
          type: 'text',
          text: `查無${getCityLabel(city as SupportedCity)}${districtMsg}的資源回收排班資料`,
        }],
      };
    }

    const cityLabel = getCityLabel(city as SupportedCity);
    const districtLabel = district ? ` ${district}` : '';
    const header = `${cityLabel}${districtLabel} 資源回收排班（共 ${displaySchedules.length} 筆）`;

    const lines = displaySchedules.slice(0, 50).map((s) =>
      `${s.scheduleDay} ${s.scheduleTime} | ${s.area} | ${s.route} | ${s.address}`
    );

    const truncNote = displaySchedules.length > 50
      ? `\n\n（僅顯示前 50 筆，共 ${displaySchedules.length} 筆）`
      : '';

    const recyclingNote = isFiltered
      ? ''
      : '\n\n提示：此城市的資源回收與一般垃圾同車收運，以上為全部排班。台灣多數城市的資源回收日為每週一、三、五或二、四、六，請依當地公告為準。';

    return {
      content: [{
        type: 'text',
        text: `${header}\n\n星期 時間 | 行政區 | 路線 | 地點\n${'-'.repeat(50)}\n${lines.join('\n')}${truncNote}${recyclingNote}`,
      }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得資源回收排班失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
