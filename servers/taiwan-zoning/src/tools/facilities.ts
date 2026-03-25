import type { Env, ToolResult } from '../types.js';
import {
  isWithinTaiwan,
  detectCityFromCoords,
  fetchArcGis,
  buildBufferQueryParams,
  ARCGIS_LAYERS,
} from '../client.js';

/**
 * query_public_facilities: 查詢附近公共設施用地
 */
export async function queryPublicFacilities(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const latitude = args.latitude as number;
    const longitude = args.longitude as number;
    const radiusMeters = (args.radius_meters as number) ?? 500;
    const facilityType = args.facility_type as string | undefined;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return {
        content: [{ type: 'text', text: '錯誤：請提供有效的經緯度座標（latitude, longitude）' }],
        isError: true,
      };
    }

    if (!isWithinTaiwan(latitude, longitude)) {
      return {
        content: [{ type: 'text', text: '錯誤：座標不在台灣範圍內（緯度 21.5-26.5, 經度 119.0-122.5）' }],
        isError: true,
      };
    }

    if (radiusMeters <= 0 || radiusMeters > 5000) {
      return {
        content: [{ type: 'text', text: '錯誤：搜尋半徑必須在 1 至 5000 公尺之間' }],
        isError: true,
      };
    }

    let where = '1=1';
    if (facilityType) {
      const typeMap: Record<string, string> = {
        park: '公園',
        school: '學校',
        road: '道路',
        market: '市場',
        parking: '停車場',
        hospital: '醫療',
      };
      const mapped = typeMap[facilityType.toLowerCase()] ?? facilityType;
      where = `NAME LIKE '%${mapped}%' OR ZONE_NAME LIKE '%${mapped}%'`;
    }

    const params = buildBufferQueryParams(latitude, longitude, radiusMeters, where);
    const data = await fetchArcGis(ARCGIS_LAYERS.PUBLIC_FACILITIES, params);

    const city = detectCityFromCoords(latitude, longitude);

    if (!data.features || data.features.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `查無附近公共設施用地\n座標：${latitude}, ${longitude}\n搜尋半徑：${radiusMeters} 公尺${facilityType ? `\n設施類型篩選：${facilityType}` : ''}`,
        }],
      };
    }

    const lines = data.features.map((f, i) => {
      const attrs = f.attributes;
      const name = (attrs.NAME ?? attrs.ZONE_NAME ?? '未知設施') as string;
      const type = (attrs.FACILITY_TYPE ?? attrs.ZONE_CODE ?? '') as string;
      const area = attrs.AREA_SQM ?? attrs.Shape_Area;

      const parts = [`${i + 1}. 設施名稱：${name}`];
      if (type) parts.push(`   類型：${type}`);
      if (area) parts.push(`   面積：${Number(area).toFixed(2)} 平方公尺`);
      return parts.join('\n');
    });

    const header = [
      '公共設施用地查詢結果',
      `座標：${latitude}, ${longitude}`,
      city ? `城市：${city}` : null,
      `搜尋半徑：${radiusMeters} 公尺`,
      facilityType ? `設施類型：${facilityType}` : null,
      `共 ${data.features.length} 筆資料`,
      '─'.repeat(30),
    ].filter(Boolean).join('\n');

    return { content: [{ type: 'text', text: `${header}\n${lines.join('\n\n')}` }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢公共設施失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
