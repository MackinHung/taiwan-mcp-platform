import { searchNearby } from '../client.js';
import type { Env, ToolResult } from '../types.js';

const DEFAULT_RADIUS_KM = 2;
const MAX_RADIUS_KM = 50;

export async function searchNearbyTool(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const lat = args.lat as number | undefined;
    const lng = args.lng as number | undefined;
    const radiusKm = (args.radiusKm as number | undefined) ?? DEFAULT_RADIUS_KM;

    if (lat === undefined || lat === null || typeof lat !== 'number') {
      return {
        content: [{ type: 'text', text: '請提供緯度（lat）' }],
        isError: true,
      };
    }

    if (lng === undefined || lng === null || typeof lng !== 'number') {
      return {
        content: [{ type: 'text', text: '請提供經度（lng）' }],
        isError: true,
      };
    }

    if (lat < 21 || lat > 26 || lng < 119 || lng > 123) {
      return {
        content: [{ type: 'text', text: '座標不在台灣範圍內（緯度 21-26、經度 119-123）' }],
        isError: true,
      };
    }

    if (radiusKm <= 0 || radiusKm > MAX_RADIUS_KM) {
      return {
        content: [{ type: 'text', text: `搜尋半徑須為 0-${MAX_RADIUS_KM} 公里` }],
        isError: true,
      };
    }

    const results = searchNearby(lat, lng, radiusKm);

    if (results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `在座標 (${lat}, ${lng}) 半徑 ${radiusKm} 公里內查無運動場館`,
        }],
      };
    }

    const lines = results.map((f) =>
      `- ${f.name}（距離 ${f.distanceKm} km）\n  地址：${f.address}\n  運動項目：${f.sportTypes.join('、')}\n  開放時間：${f.openHours}\n  費用：${f.fee}`
    );

    const header = `座標 (${lat}, ${lng}) 半徑 ${radiusKm} 公里內的運動場館：共 ${results.length} 間`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `搜尋附近場館失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
