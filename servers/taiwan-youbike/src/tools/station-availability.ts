import { fetchStations, VALID_CITIES } from '../client.js';
import type { CityCode, Env, ToolResult } from '../types.js';

export async function getStationAvailability(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as CityCode | undefined;
    const stationName = args.stationName as string | undefined;

    if (!city || !VALID_CITIES.includes(city)) {
      return {
        content: [{ type: 'text', text: `請提供有效的城市代碼: ${VALID_CITIES.join(', ')}` }],
        isError: true,
      };
    }

    if (!stationName || typeof stationName !== 'string' || stationName.trim() === '') {
      return {
        content: [{ type: 'text', text: '請提供站名關鍵字 (stationName)' }],
        isError: true,
      };
    }

    const stations = await fetchStations(city);
    const keyword = stationName.trim().toLowerCase();
    const matched = stations.filter(
      (s) =>
        s.sna.toLowerCase().includes(keyword) ||
        s.snaen.toLowerCase().includes(keyword)
    );

    if (matched.length === 0) {
      return {
        content: [{ type: 'text', text: `在 ${city} 找不到包含「${stationName}」的站點` }],
      };
    }

    const lines = matched.map((s) => {
      const status = s.act === 1 ? '營運中' : '暫停營運';
      return [
        `站點: ${s.sna} (${s.snaen})`,
        `  狀態: ${status}`,
        `  可借車輛: ${s.sbi} / 總車位: ${s.tot}`,
        `  可還空位: ${s.bemp}`,
        `  地址: ${s.ar}`,
        `  更新時間: ${s.mday}`,
      ].join('\n');
    });

    const header = `${city} — 搜尋「${stationName}」找到 ${matched.length} 個站點`;
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
