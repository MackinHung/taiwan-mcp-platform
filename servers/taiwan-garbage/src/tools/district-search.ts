import {
  fetchSchedule,
  fetchRealtimeLocations,
  isValidCity,
  isGpsCity,
  getCityLabel,
} from '../client.js';
import type { Env, ToolResult, SupportedCity } from '../types.js';

export async function searchByDistrict(
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

    if (!district || typeof district !== 'string') {
      return {
        content: [{ type: 'text', text: '請提供行政區名稱（如 中正、信義、三民）' }],
        isError: true,
      };
    }

    if (!isValidCity(city)) {
      return {
        content: [{ type: 'text', text: `不支援的城市: ${city}。支援的城市: taipei, tainan, new_taipei, taoyuan, kaohsiung, taichung` }],
        isError: true,
      };
    }

    const cityLabel = getCityLabel(city as SupportedCity);
    const sections: string[] = [];

    // Section 1: Schedule
    sections.push(`【${cityLabel} ${district} 垃圾資訊總覽】`);

    try {
      const schedules = await fetchSchedule(city as SupportedCity, district);
      if (schedules.length > 0) {
        sections.push(`\n📅 排班資訊（共 ${schedules.length} 筆）`);
        const scheduleLines = schedules.slice(0, 20).map((s) =>
          `  ${s.scheduleDay} ${s.scheduleTime} | ${s.route} | ${s.address}`
        );
        sections.push(scheduleLines.join('\n'));
        if (schedules.length > 20) {
          sections.push(`  ...（共 ${schedules.length} 筆，僅顯示前 20 筆）`);
        }
      } else {
        sections.push(`\n📅 排班資訊：查無${district}的排班資料`);
      }
    } catch (scheduleErr) {
      sections.push(`\n📅 排班資訊：取得失敗 (${(scheduleErr as Error).message})`);
    }

    // Section 2: Real-time GPS (if available)
    if (isGpsCity(city as SupportedCity)) {
      try {
        const locations = await fetchRealtimeLocations(city as SupportedCity, _env);
        const districtLocations = locations.filter(
          (loc) => loc.area?.includes(district)
        );
        if (districtLocations.length > 0) {
          sections.push(`\n🚛 即時位置（共 ${districtLocations.length} 輛）`);
          const locLines = districtLocations.slice(0, 10).map((loc) =>
            `  ${loc.carNo} | ${loc.routeName} | (${loc.latitude}, ${loc.longitude}) | ${loc.gpsTime}`
          );
          sections.push(locLines.join('\n'));
          sections.push('  ⚠ GPS 資料有 1-2 分鐘延遲');
        } else {
          sections.push(`\n🚛 即時位置：${district}目前無運行中的垃圾車`);
        }
      } catch (gpsErr) {
        sections.push(`\n🚛 即時位置：取得失敗 (${(gpsErr as Error).message})`);
      }
    } else {
      sections.push(`\n🚛 即時位置：台北僅提供排班，不支援GPS即時追蹤`);
    }

    return {
      content: [{ type: 'text', text: sections.join('\n') }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `搜尋行政區資訊失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
