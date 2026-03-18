import { fetchEndpoint, isValidCity, VALID_CITIES } from '../client.js';
import type { Env, ToolResult, ParkingAvailability } from '../types.js';

export async function getParkingSummary(
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

    const availability = await fetchEndpoint<ParkingAvailability[]>(
      env,
      `/OffStreet/ParkingAvailability/City/${city}`,
      { $top: '1000' }
    );

    if (!availability || availability.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `${city} 查無停車概況資料`,
          },
        ],
      };
    }

    const totalParks = availability.length;
    const totalSpaces = availability.reduce((sum, a) => {
      return sum + (a.TotalSpaces ?? 0);
    }, 0);
    const totalAvailable = availability.reduce((sum, a) => {
      return sum + (a.AvailableSpaces ?? 0);
    }, 0);
    const occupancyRate =
      totalSpaces > 0
        ? (((totalSpaces - totalAvailable) / totalSpaces) * 100).toFixed(1)
        : '0';

    const fullParks = availability.filter(
      (a) => a.AvailableSpaces !== undefined && a.AvailableSpaces === 0
    ).length;
    const nearFullParks = availability.filter(
      (a) =>
        a.AvailableSpaces !== undefined &&
        a.TotalSpaces !== undefined &&
        a.TotalSpaces > 0 &&
        a.AvailableSpaces > 0 &&
        a.AvailableSpaces / a.TotalSpaces < 0.1
    ).length;

    const lines = [
      `城市: ${city}`,
      `停車場數量: ${totalParks}`,
      `總車位: ${totalSpaces.toLocaleString()}`,
      `空位數: ${totalAvailable.toLocaleString()}`,
      `使用率: ${occupancyRate}%`,
      `已滿停車場: ${fullParks}`,
      `即將滿位（<10%空位）: ${nearFullParks}`,
    ];

    const header = `${city} 停車概況`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得停車概況失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
