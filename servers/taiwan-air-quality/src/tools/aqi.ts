import type { Env, ToolResult, AqiStation } from '../types.js';
import { fetchAqiData } from '../client.js';

function formatStation(s: AqiStation): string {
  return [
    `${s.sitename}（${s.county}）`,
    `  AQI: ${s.aqi} — ${s.status}`,
    `  主要污染物: ${s.pollutant || '無'}`,
    `  PM2.5: ${s['pm2.5']} μg/m³ | PM10: ${s.pm10} μg/m³`,
    `  O3: ${s.o3} ppb | CO: ${s.co} ppm`,
  ].join('\n');
}

export async function getAqi(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;
    const station = args.station as string | undefined;

    const records = await fetchAqiData(env.MOENV_API_KEY);

    let filtered = records;
    if (county) {
      filtered = filtered.filter((r) => r.county === county);
    }
    if (station) {
      filtered = filtered.filter((r) => r.sitename === station);
    }

    if (filtered.length === 0) {
      const label = station ?? county ?? '全台';
      return {
        content: [{ type: 'text', text: `找不到 ${label} 的空氣品質資料` }],
      };
    }

    const lines = filtered.map(formatStation);
    return { content: [{ type: 'text', text: lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得空氣品質資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}

export async function getStationDetail(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const station = args.station as string;
    if (!station) {
      return {
        content: [{ type: 'text', text: '請提供測站名稱（station 參數）' }],
        isError: true,
      };
    }

    const records = await fetchAqiData(env.MOENV_API_KEY);
    const found = records.find((r) => r.sitename === station);

    if (!found) {
      return {
        content: [{ type: 'text', text: `找不到測站: ${station}` }],
      };
    }

    const detail = [
      `測站: ${found.sitename}（${found.county}）`,
      `發布時間: ${found.publishtime}`,
      `座標: ${found.latitude}, ${found.longitude}`,
      '',
      `AQI: ${found.aqi} — ${found.status}`,
      `主要污染物: ${found.pollutant || '無'}`,
      '',
      '--- 污染物濃度 ---',
      `PM2.5: ${found['pm2.5']} μg/m³（均值: ${found.pm2_5_avg}）`,
      `PM10:  ${found.pm10} μg/m³（均值: ${found.pm10_avg}）`,
      `O3:    ${found.o3} ppb（8hr: ${found.o3_8hr}）`,
      `CO:    ${found.co} ppm（8hr: ${found.co_8hr}）`,
      `SO2:   ${found.so2} ppb（均值: ${found.so2_avg}）`,
      `NO2:   ${found.no2} ppb`,
      `NOx:   ${found.nox} ppb`,
      `NO:    ${found.no} ppb`,
      '',
      '--- 氣象 ---',
      `風速: ${found.wind_speed} m/s`,
      `風向: ${found.wind_direc}°`,
    ].join('\n');

    return { content: [{ type: 'text', text: detail }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得測站詳細資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
