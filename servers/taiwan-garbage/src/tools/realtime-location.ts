import { fetchRealtimeLocations, isValidCity, isGpsCity, getCityLabel } from '../client.js';
import type { Env, ToolResult, SupportedCity } from '../types.js';

export async function getRealtimeLocation(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;

    if (!city || typeof city !== 'string') {
      return {
        content: [{ type: 'text', text: '請提供城市代碼（如 tainan, new_taipei, taoyuan, kaohsiung, taichung）' }],
        isError: true,
      };
    }

    if (!isValidCity(city)) {
      return {
        content: [{ type: 'text', text: `不支援的城市: ${city}。支援 GPS 即時追蹤的城市: tainan, new_taipei, taoyuan, kaohsiung, taichung` }],
        isError: true,
      };
    }

    // Taipei does NOT have GPS tracking
    if (!isGpsCity(city as SupportedCity)) {
      return {
        content: [{
          type: 'text',
          text: `台北僅提供排班，不支援GPS即時追蹤。請使用 get_truck_schedule 查詢台北市的垃圾車排班時間。`,
        }],
        isError: true,
      };
    }

    const locations = await fetchRealtimeLocations(city as SupportedCity, _env);

    if (locations.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `目前${getCityLabel(city as SupportedCity)}沒有運行中的垃圾車（可能非收運時段）`,
        }],
      };
    }

    const header = `${getCityLabel(city as SupportedCity)} 垃圾車即時位置（共 ${locations.length} 輛）`;

    const lines = locations.slice(0, 50).map((loc) =>
      `${loc.carNo} | ${loc.area} | ${loc.routeName} | (${loc.latitude}, ${loc.longitude}) | ${loc.gpsTime}`
    );

    const note = locations.length > 50
      ? `\n\n（僅顯示前 50 輛，共 ${locations.length} 輛）`
      : '';

    const gpsNote = '\n\n⚠ GPS 資料有 1-2 分鐘延遲，位置僅供參考。';

    return {
      content: [{
        type: 'text',
        text: `${header}\n\n車號 | 行政區 | 路線 | 座標 | GPS時間\n${'-'.repeat(60)}\n${lines.join('\n')}${note}${gpsNote}`,
      }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得即時位置失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
