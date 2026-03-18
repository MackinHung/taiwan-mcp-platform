import { fetchAllStations } from '../client.js';
import type { Env, ToolResult, YouBikeStation } from '../types.js';

const EARTH_RADIUS_KM = 6371;
const DEFAULT_RADIUS_KM = 0.5;
const MAX_RADIUS_KM = 50;

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

interface StationWithDistance {
  station: YouBikeStation;
  distance: number;
  city: string;
}

export async function searchNearbyStations(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const lat = args.lat as number | undefined;
    const lng = args.lng as number | undefined;
    const radiusKm = (args.radiusKm as number | undefined) ?? DEFAULT_RADIUS_KM;

    if (lat == null || typeof lat !== 'number' || lat < -90 || lat > 90) {
      return {
        content: [{ type: 'text', text: '請提供有效的緯度 (lat)，範圍 -90 到 90' }],
        isError: true,
      };
    }

    if (lng == null || typeof lng !== 'number' || lng < -180 || lng > 180) {
      return {
        content: [{ type: 'text', text: '請提供有效的經度 (lng)，範圍 -180 到 180' }],
        isError: true,
      };
    }

    if (typeof radiusKm !== 'number' || radiusKm <= 0 || radiusKm > MAX_RADIUS_KM) {
      return {
        content: [{ type: 'text', text: `搜尋半徑須在 0 ~ ${MAX_RADIUS_KM} km 之間` }],
        isError: true,
      };
    }

    const cityResults = await fetchAllStations();
    const nearby: StationWithDistance[] = [];

    for (const { city, stations } of cityResults) {
      for (const station of stations) {
        if (station.lat === 0 && station.lng === 0) continue;
        const distance = haversineDistance(lat, lng, station.lat, station.lng);
        if (distance <= radiusKm) {
          nearby.push({ station, distance, city });
        }
      }
    }

    nearby.sort((a, b) => a.distance - b.distance);

    if (nearby.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `在 (${lat}, ${lng}) 半徑 ${radiusKm} km 內找不到 YouBike 站點`,
        }],
      };
    }

    const lines = nearby.slice(0, 20).map((item) => {
      const s = item.station;
      const dist = item.distance.toFixed(2);
      return [
        `${s.sna} (${item.city}) — ${dist} km`,
        `  可借: ${s.sbi} / 空位: ${s.bemp} / 總計: ${s.tot}`,
        `  地址: ${s.ar}`,
      ].join('\n');
    });

    const header = `(${lat}, ${lng}) 半徑 ${radiusKm} km 內找到 ${nearby.length} 個站點（顯示前 20）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `錯誤: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
