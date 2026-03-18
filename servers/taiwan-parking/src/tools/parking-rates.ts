import { fetchEndpoint, isValidCity, VALID_CITIES } from '../client.js';
import type { Env, ToolResult, CarPark } from '../types.js';

export async function getParkingRates(
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
      $select: 'CarParkID,CarParkName,FareDescription,TotalSpaces',
    };

    if (parkingId) {
      params['$filter'] = `CarParkID eq '${parkingId}'`;
    }

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
            text: parkingId
              ? `${city} 查無停車場 ${parkingId} 的費率資料`
              : `${city} 查無停車場費率資料`,
          },
        ],
      };
    }

    const lines = carParks.map((p) => {
      return [
        `停車場: ${p.CarParkName?.Zh_tw ?? p.CarParkID}`,
        `  ID: ${p.CarParkID}`,
        `  總車位: ${p.TotalSpaces ?? '未知'}`,
        `  費率說明: ${p.FareDescription ?? '未提供'}`,
      ].join('\n');
    });

    const header = `${city} 停車場費率（顯示 ${carParks.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得停車費率失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
