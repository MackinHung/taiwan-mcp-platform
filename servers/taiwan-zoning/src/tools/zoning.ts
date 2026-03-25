import type { Env, ToolResult } from '../types.js';
import {
  isWithinTaiwan,
  normalizeCity,
  detectCityFromCoords,
  fetchArcGis,
  fetchTaichungApi,
  buildSpatialQueryParams,
  ARCGIS_LAYERS,
} from '../client.js';

/**
 * query_zoning_by_location: 查詢指定座標的都市計畫使用分區
 */
export async function queryZoningByLocation(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const latitude = args.latitude as number;
    const longitude = args.longitude as number;
    const cityArg = args.city as string | undefined;

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

    const city = cityArg ? normalizeCity(cityArg) : detectCityFromCoords(latitude, longitude);

    // Route to Taichung API if detected
    if (city === '臺中市') {
      return await queryTaichungZoning(latitude, longitude);
    }

    // Default: Use Taipei ArcGIS REST API (works for Taipei; fallback for others)
    const params = buildSpatialQueryParams(latitude, longitude);
    const data = await fetchArcGis(ARCGIS_LAYERS.ZONING, params);

    if (!data.features || data.features.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `查無使用分區資料\n座標：${latitude}, ${longitude}\n${city ? `偵測城市：${city}` : '未偵測到城市'}\n可能原因：該座標不在都市計畫範圍內`,
        }],
      };
    }

    const lines = data.features.map((f, i) => {
      const attrs = f.attributes;
      const name = (attrs.NAME ?? attrs.ZONE_NAME ?? attrs.Zone_Name ?? '未知') as string;
      const code = (attrs.ZONE_CODE ?? attrs.Zone_Code ?? '') as string;
      const area = attrs.AREA_SQM ?? attrs.Shape_Area;
      const plan = (attrs.PLAN_NAME ?? attrs.Plan_Name ?? '') as string;

      const parts = [`${i + 1}. 分區名稱：${name}`];
      if (code) parts.push(`   分區代碼：${code}`);
      if (area) parts.push(`   面積：${Number(area).toFixed(2)} 平方公尺`);
      if (plan) parts.push(`   計畫名稱：${plan}`);
      return parts.join('\n');
    });

    const header = `都市計畫使用分區查詢結果\n座標：${latitude}, ${longitude}${city ? `\n城市：${city}` : ''}\n共 ${data.features.length} 筆資料\n${'─'.repeat(30)}`;
    return { content: [{ type: 'text', text: `${header}\n${lines.join('\n\n')}` }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢使用分區失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

async function queryTaichungZoning(latitude: number, longitude: number): Promise<ToolResult> {
  const data = await fetchTaichungApi('UrbanZoning', {
    lat: String(latitude),
    lng: String(longitude),
  });

  if (!data.result || data.result.length === 0) {
    return {
      content: [{
        type: 'text',
        text: `查無臺中市使用分區資料\n座標：${latitude}, ${longitude}`,
      }],
    };
  }

  const lines = data.result.map((item, i) => {
    const parts = [`${i + 1}. 分區名稱：${item.zone_name}`];
    if (item.zone_code) parts.push(`   分區代碼：${item.zone_code}`);
    if (item.area_sqm) parts.push(`   面積：${item.area_sqm.toFixed(2)} 平方公尺`);
    if (item.plan_name) parts.push(`   計畫名稱：${item.plan_name}`);
    return parts.join('\n');
  });

  const header = `臺中市都市計畫使用分區查詢結果\n座標：${latitude}, ${longitude}\n共 ${data.result.length} 筆資料\n${'─'.repeat(30)}`;
  return { content: [{ type: 'text', text: `${header}\n${lines.join('\n\n')}` }] };
}

/**
 * list_urban_zones: 列出城市內所有都市計畫分區類型與統計
 */
export async function listUrbanZones(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const cityArg = args.city as string;
    if (!cityArg) {
      return {
        content: [{ type: 'text', text: '錯誤：請提供城市名稱（city 參數）' }],
        isError: true,
      };
    }

    const city = normalizeCity(cityArg);
    const zoneType = args.zone_type as string | undefined;

    // Route to Taichung API if applicable
    if (city === '臺中市') {
      return await listTaichungZones(city, zoneType);
    }

    // Default: Use Taipei ArcGIS REST API
    let where = 'OBJECTID>0';
    if (zoneType) {
      const typeMap: Record<string, string> = {
        residential: 'R',
        commercial: 'C',
        industrial: 'I',
      };
      const code = typeMap[zoneType.toLowerCase()] ?? zoneType;
      where = `ZONE_CODE='${code}'`;
    }

    const data = await fetchArcGis(ARCGIS_LAYERS.ZONING, {
      where,
      outFields: '*',
      returnGeometry: 'false',
      outStatistics: JSON.stringify([
        { statisticType: 'count', onStatisticField: 'OBJECTID', outStatisticFieldName: 'COUNT' },
        { statisticType: 'sum', onStatisticField: 'AREA_SQM', outStatisticFieldName: 'TOTAL_AREA' },
      ]),
      groupByFieldsForStatistics: 'ZONE_CODE,NAME',
    });

    if (!data.features || data.features.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `${city} 查無分區統計資料${zoneType ? `（篩選：${zoneType}）` : ''}`,
        }],
      };
    }

    const lines = data.features.map((f) => {
      const attrs = f.attributes;
      const name = (attrs.NAME ?? '未知') as string;
      const code = (attrs.ZONE_CODE ?? '') as string;
      const count = (attrs.COUNT ?? 0) as number;
      const totalArea = attrs.TOTAL_AREA as number | undefined;

      const parts = [`分區：${name}（${code}）`];
      parts.push(`  數量：${count} 筆`);
      if (totalArea) parts.push(`  總面積：${totalArea.toFixed(2)} 平方公尺`);
      return parts.join('\n');
    });

    const header = `${city} 都市計畫分區統計${zoneType ? `（類型：${zoneType}）` : ''}\n${'─'.repeat(30)}`;
    return { content: [{ type: 'text', text: `${header}\n${lines.join('\n\n')}` }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢分區統計失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

async function listTaichungZones(city: string, zoneType?: string): Promise<ToolResult> {
  const params: Record<string, string> = {};
  if (zoneType) params.zone_type = zoneType;

  const data = await fetchTaichungApi('UrbanZoneStats', params);

  if (!data.result || data.result.length === 0) {
    return {
      content: [{
        type: 'text',
        text: `${city} 查無分區統計資料${zoneType ? `（篩選：${zoneType}）` : ''}`,
      }],
    };
  }

  const lines = data.result.map((item) => {
    const parts = [`分區：${item.zone_name}（${item.zone_code}）`];
    if (item.area_sqm) parts.push(`  總面積：${item.area_sqm.toFixed(2)} 平方公尺`);
    return parts.join('\n');
  });

  const header = `${city} 都市計畫分區統計${zoneType ? `（類型：${zoneType}）` : ''}\n${'─'.repeat(30)}`;
  return { content: [{ type: 'text', text: `${header}\n${lines.join('\n\n')}` }] };
}
