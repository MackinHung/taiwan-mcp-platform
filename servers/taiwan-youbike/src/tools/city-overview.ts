import { fetchStations, VALID_CITIES } from '../client.js';
import type { CityCode, Env, ToolResult } from '../types.js';

export async function getCityOverview(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as CityCode | undefined;

    if (!city || !VALID_CITIES.includes(city)) {
      return {
        content: [{ type: 'text', text: `請提供有效的城市代碼: ${VALID_CITIES.join(', ')}` }],
        isError: true,
      };
    }

    const stations = await fetchStations(city);

    if (stations.length === 0) {
      return {
        content: [{ type: 'text', text: `${city} 目前沒有 YouBike 站點資料` }],
      };
    }

    const activeStations = stations.filter((s) => s.act === 1);
    const totalBikes = stations.reduce((sum, s) => sum + s.sbi, 0);
    const totalEmpty = stations.reduce((sum, s) => sum + s.bemp, 0);
    const totalDocks = stations.reduce((sum, s) => sum + s.tot, 0);

    // District breakdown
    const districtMap = new Map<string, { count: number; bikes: number; empty: number }>();
    for (const s of stations) {
      const district = s.sarea || '未知';
      const existing = districtMap.get(district) ?? { count: 0, bikes: 0, empty: 0 };
      districtMap.set(district, {
        count: existing.count + 1,
        bikes: existing.bikes + s.sbi,
        empty: existing.empty + s.bemp,
      });
    }

    const districtLines = Array.from(districtMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data]) =>
        `  ${name}: ${data.count} 站 | 可借: ${data.bikes} | 空位: ${data.empty}`
      );

    const text = [
      `${city} YouBike 總覽`,
      ``,
      `站點總數: ${stations.length}（營運中: ${activeStations.length}）`,
      `總可借車輛: ${totalBikes}`,
      `總可還空位: ${totalEmpty}`,
      `總車位數: ${totalDocks}`,
      ``,
      `各區分布:`,
      ...districtLines,
    ].join('\n');

    return {
      content: [{ type: 'text', text }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `錯誤: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
