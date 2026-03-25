import type { Env, ToolResult, SensitiveAreaFeature } from '../types.js';
import { fetchSensitiveAreas, haversineDistance, getGeometryCentroid } from '../client.js';

/**
 * Query geological sensitive areas near a given coordinate.
 * Fetches GeoJSON from data.gov.tw and computes distances.
 */
export async function querySensitiveAreas(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const latitude = args.latitude as number | undefined;
    const longitude = args.longitude as number | undefined;
    const radiusKm = (args.radius_km as number) ?? 5;

    if (latitude === undefined || longitude === undefined) {
      return {
        content: [{ type: 'text', text: '錯誤：必須提供 latitude 和 longitude 參數' }],
        isError: true,
      };
    }

    if (latitude < 21.5 || latitude > 25.5 || longitude < 119.0 || longitude > 122.5) {
      return {
        content: [{ type: 'text', text: '錯誤：座標超出台灣範圍（緯度 21.5-25.5，經度 119.0-122.5）' }],
        isError: true,
      };
    }

    const geoJson = await fetchSensitiveAreas();
    const features = geoJson?.features ?? [];

    if (features.length === 0) {
      return {
        content: [{ type: 'text', text: '無法取得地質敏感區資料' }],
      };
    }

    const nearby = findNearbySensitiveAreas(features, latitude, longitude, radiusKm);

    if (nearby.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `座標 (${latitude}, ${longitude}) 半徑 ${radiusKm} 公里內無地質敏感區`,
        }],
      };
    }

    const lines = [
      `📍 查詢座標: (${latitude}, ${longitude})`,
      `🔍 搜尋半徑: ${radiusKm} 公里`,
      `📊 找到 ${nearby.length} 個地質敏感區:`,
      '',
      ...nearby.map((item, i) => {
        const props = item.feature.properties;
        return [
          `${i + 1}. ${props.SENSIT_NAME}`,
          `   編號: ${props.SENSIT_ID}`,
          `   類型: ${props.SENSIT_TYPE}`,
          `   縣市: ${props.COUNTY}`,
          `   鄉鎮: ${props.TOWN}`,
          `   面積: ${props.AREA_HA} 公頃`,
          `   公告日期: ${props.ANNOUNCE_DATE}`,
          `   距離: ${item.distance.toFixed(1)} 公里`,
        ].join('\n');
      }),
      '',
      '※ 資料來源：經濟部地質調查及礦業管理中心',
      '※ 地質敏感區內之開發行為須進行地質調查及地質安全評估',
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `查詢地質敏感區失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}

interface NearbySensitiveArea {
  feature: SensitiveAreaFeature;
  distance: number;
}

function findNearbySensitiveAreas(
  features: SensitiveAreaFeature[],
  lat: number,
  lon: number,
  radiusKm: number
): NearbySensitiveArea[] {
  const results: NearbySensitiveArea[] = [];

  for (const feature of features) {
    const centroid = getGeometryCentroid(feature.geometry);
    if (!centroid) continue;

    const dist = haversineDistance(lat, lon, centroid.lat, centroid.lon);
    if (dist <= radiusKm) {
      results.push({ feature, distance: dist });
    }
  }

  return results.sort((a, b) => a.distance - b.distance);
}
