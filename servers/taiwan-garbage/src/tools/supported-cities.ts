import {
  ALL_SUPPORTED_CITIES,
  SUPPORTED_GPS_CITIES,
  getCityLabel,
  isGpsCity,
} from '../client.js';
import type { Env, ToolResult, SupportedCity } from '../types.js';

export async function getSupportedCities(
  _env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  const cities = ALL_SUPPORTED_CITIES.map((city) => {
    const hasGps = isGpsCity(city);
    return {
      code: city,
      name: getCityLabel(city),
      capabilities: {
        gpsTracking: hasGps,
        schedule: true,
      },
      note: hasGps
        ? 'GPS 即時追蹤 + 排班查詢'
        : '僅排班查詢（無 GPS 即時追蹤）',
    };
  });

  const gpsCount = SUPPORTED_GPS_CITIES.length;
  const totalCount = ALL_SUPPORTED_CITIES.length;

  const header = `支援城市一覽（共 ${totalCount} 個城市，${gpsCount} 個支援 GPS 即時追蹤）`;

  const lines = cities.map((c) =>
    `${c.code} (${c.name}) — ${c.note}`
  );

  const info = [
    header,
    '',
    ...lines,
    '',
    '說明：',
    '- 台灣沒有公共垃圾桶，民眾須在定點定時等垃圾車丟垃圾',
    '- GPS 即時追蹤資料有 1-2 分鐘延遲',
    '- 台北僅提供排班，不支援GPS即時追蹤',
  ];

  return {
    content: [{ type: 'text', text: info.join('\n') }],
  };
}
