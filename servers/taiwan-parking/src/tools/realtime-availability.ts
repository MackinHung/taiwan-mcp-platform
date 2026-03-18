import { fetchEndpoint, isValidCity, VALID_CITIES } from '../client.js';
import type { Env, ToolResult, ParkingAvailability } from '../types.js';

export async function getRealtimeAvailability(
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

    const parkingId = args.parkingId as string | undefined;
    const limit = (args.limit as number) ?? 30;

    const params: Record<string, string> = {
      $top: String(limit),
    };

    if (parkingId) {
      params['$filter'] = `CarParkID eq '${parkingId}'`;
    }

    const availability = await fetchEndpoint<ParkingAvailability[]>(
      env,
      `/OffStreet/ParkingAvailability/City/${city}`,
      params
    );

    if (!availability || availability.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: parkingId
              ? `${city} 查無停車場 ${parkingId} 的即時空位資料`
              : `${city} 查無即時空位資料`,
          },
        ],
      };
    }

    const lines = availability.map((a) => {
      const spacesInfo = a.Spaces
        ? a.Spaces.map(
            (s) => `    類型${s.SpaceType}: 空位 ${s.AvailableSpaces}/${s.NumberOfSpaces}`
          ).join('\n')
        : '';

      return [
        `停車場: ${a.CarParkName?.Zh_tw ?? a.CarParkID}`,
        `  ID: ${a.CarParkID}`,
        `  空位: ${a.AvailableSpaces ?? '未知'}`,
        `  總車位: ${a.TotalSpaces ?? '未知'}`,
        `  更新時間: ${a.DataCollectTime ?? '未知'}`,
        spacesInfo ? `  車位明細:\n${spacesInfo}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    });

    const header = `${city} 即時停車空位（顯示 ${availability.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得即時空位失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
