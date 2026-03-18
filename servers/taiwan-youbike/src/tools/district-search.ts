import { fetchStations, VALID_CITIES } from '../client.js';
import type { CityCode, Env, ToolResult } from '../types.js';

export async function searchByDistrict(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as CityCode | undefined;
    const district = args.district as string | undefined;

    if (!city || !VALID_CITIES.includes(city)) {
      return {
        content: [{ type: 'text', text: `請提供有效的城市代碼: ${VALID_CITIES.join(', ')}` }],
        isError: true,
      };
    }

    if (!district || typeof district !== 'string' || district.trim() === '') {
      return {
        content: [{ type: 'text', text: '請提供行政區名稱 (district)' }],
        isError: true,
      };
    }

    const stations = await fetchStations(city);
    const keyword = district.trim();
    const matched = stations.filter(
      (s) =>
        s.sarea.includes(keyword) ||
        s.sareaen.toLowerCase().includes(keyword.toLowerCase())
    );

    if (matched.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `在 ${city} 的「${district}」找不到 YouBike 站點`,
        }],
      };
    }

    const totalBikes = matched.reduce((sum, s) => sum + s.sbi, 0);
    const totalEmpty = matched.reduce((sum, s) => sum + s.bemp, 0);
    const totalDocks = matched.reduce((sum, s) => sum + s.tot, 0);

    const lines = matched.map((s) => {
      const status = s.act === 1 ? '營運中' : '暫停';
      return `  ${s.sna} | 可借: ${s.sbi} | 空位: ${s.bemp} | ${status}`;
    });

    const header = [
      `${city} ${district} — ${matched.length} 個站點`,
      `總可借車輛: ${totalBikes} / 總空位: ${totalEmpty} / 總車位: ${totalDocks}`,
    ].join('\n');

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `錯誤: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
