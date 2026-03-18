import { fetchEndpoint, isValidCity, VALID_CITIES } from '../client.js';
import type { Env, ToolResult, CarPark } from '../types.js';

export async function searchParking(
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

    const keyword = args.keyword as string | undefined;
    const limit = (args.limit as number) ?? 30;

    const params: Record<string, string> = {
      $top: String(limit),
    };

    if (keyword) {
      params['$filter'] = `contains(CarParkName/Zh_tw, '${keyword}')`;
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
            text: keyword
              ? `${city} 查無包含「${keyword}」的停車場`
              : `${city} 查無停車場資料`,
          },
        ],
      };
    }

    const lines = carParks.map((p) => {
      return [
        `停車場: ${p.CarParkName?.Zh_tw ?? p.CarParkID}`,
        `  ID: ${p.CarParkID}`,
        `  地址: ${p.Address ?? '未知'}`,
        `  總車位: ${p.TotalSpaces ?? '未知'}`,
        `  電話: ${p.Telephone ?? '未知'}`,
        `  費率: ${p.FareDescription ?? '未知'}`,
      ].join('\n');
    });

    const header = `${city} 停車場搜尋結果（顯示 ${carParks.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `搜尋停車場失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
