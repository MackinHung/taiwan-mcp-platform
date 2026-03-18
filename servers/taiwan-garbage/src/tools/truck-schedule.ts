import { fetchSchedule, isValidCity, getCityLabel } from '../client.js';
import type { Env, ToolResult, SupportedCity } from '../types.js';

export async function getTruckSchedule(
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

    if (schedules.length === 0) {
      const districtMsg = district ? `${district}區` : '';
      return {
        content: [{
          type: 'text',
          text: `查無${getCityLabel(city as SupportedCity)}${districtMsg}的垃圾車排班資料`,
        }],
      };
    }

    const header = `${getCityLabel(city as SupportedCity)}${district ? ` ${district}` : ''} 垃圾車排班（共 ${schedules.length} 筆）`;

    const lines = schedules.slice(0, 50).map((s) =>
      `${s.scheduleDay} ${s.scheduleTime} | ${s.area} | ${s.route} | ${s.address}`
    );

    const note = schedules.length > 50
      ? `\n\n（僅顯示前 50 筆，共 ${schedules.length} 筆）`
      : '';

    return {
      content: [{
        type: 'text',
        text: `${header}\n\n星期 時間 | 行政區 | 路線 | 地點\n${'-'.repeat(50)}\n${lines.join('\n')}${note}`,
      }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得垃圾車排班失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
