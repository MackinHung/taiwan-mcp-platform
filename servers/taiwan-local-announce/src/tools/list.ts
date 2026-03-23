import { fetchCityAnnouncements, fetchAllCityAnnouncements } from '../clients/index.js';
import type { CityId, Env, ToolResult } from '../types.js';
import { CITY_NAMES, ALL_CITY_IDS } from '../types.js';

export async function listLocalAnnouncementsTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as CityId | undefined;
    const limit = Math.min((args.limit as number) ?? 20, 100);
    const offset = (args.offset as number) ?? 0;

    if (city && !ALL_CITY_IDS.includes(city)) {
      return {
        content: [
          {
            type: 'text',
            text: `不支援的城市: ${city}。支援: ${ALL_CITY_IDS.join(', ')}`,
          },
        ],
        isError: true,
      };
    }

    const all = city
      ? await fetchCityAnnouncements(city)
      : await fetchAllCityAnnouncements();

    const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
    const page = sorted.slice(offset, offset + limit);

    if (page.length === 0) {
      const cityLabel = city ? CITY_NAMES[city] : '全部城市';
      return {
        content: [{ type: 'text', text: `${cityLabel}目前無公告資料` }],
      };
    }

    const lines = page.map((a) => {
      return [
        `[${CITY_NAMES[a.city]}] ${a.title}`,
        `  發布機關: ${a.agency}`,
        `  分類: ${a.category}`,
        `  日期: ${a.date}`,
        `  連結: ${a.url}`,
      ].join('\n');
    });

    const cityLabel = city ? CITY_NAMES[city] : '六都';
    const header = `${cityLabel}公告（共 ${all.length} 筆，顯示第 ${offset + 1}-${offset + page.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得公告失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
