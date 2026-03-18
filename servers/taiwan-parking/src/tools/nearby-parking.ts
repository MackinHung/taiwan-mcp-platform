import { fetchEndpoint, isValidCity, VALID_CITIES } from '../client.js';
import type { Env, ToolResult, CarPark } from '../types.js';

export async function searchNearbyParking(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;
    if (!city || !isValidCity(city)) {
      return {
        content: [
          {
            type: 'text',
            text: `請提供有效的城市代碼: ${VALID_CITIES.join(', ')}`,
          },
        ],
        isError: true,
      };
    }

    const latitude = args.latitude as number | undefined;
    const longitude = args.longitude as number | undefined;
    if (latitude === undefined || longitude === undefined) {
      return {
        content: [
          {
            type: 'text',
            text: '請提供經緯度座標 (latitude, longitude)',
          },
        ],
        isError: true,
      };
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return {
        content: [
          {
            type: 'text',
            text: '經緯度座標超出有效範圍（緯度: -90~90, 經度: -180~180）',
          },
        ],
        isError: true,
      };
    }

    const radius = (args.radius as number) ?? 500;

    const params: Record<string, string> = {
      $spatialFilter: `nearby(${latitude}, ${longitude}, ${radius})`,
      $top: '30',
    };

    const carParks = await fetchEndpoint<CarPark[]>(
      env,
      `/OffStreet/CarPark/City/${city}`,
      params
    );

    if (!carParks || carParks.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `座標 (${latitude}, ${longitude}) 半徑 ${radius} 公尺內查無停車場`,
          },
        ],
      };
    }

    const lines = carParks.map((p) => {
      const pos = p.CarParkPosition;
      const distText = pos
        ? `距離: 約 ${calculateDistance(latitude, longitude, pos.PositionLat, pos.PositionLon).toFixed(0)} 公尺`
        : '';

      return [
        `停車場: ${p.CarParkName?.Zh_tw ?? p.CarParkID}`,
        `  ID: ${p.CarParkID}`,
        `  地址: ${p.Address ?? '未知'}`,
        `  總車位: ${p.TotalSpaces ?? '未知'}`,
        distText ? `  ${distText}` : '',
        `  費率: ${p.FareDescription ?? '未知'}`,
      ]
        .filter(Boolean)
        .join('\n');
    });

    const header = `座標 (${latitude}, ${longitude}) 附近 ${radius}m 停車場（共 ${carParks.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `搜尋附近停車場失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
