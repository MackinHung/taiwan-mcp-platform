import { fetchCityAnnouncements, fetchAllCityAnnouncements } from '../clients/index.js';
import type { CityId, Env, ToolResult } from '../types.js';
import { CITY_NAMES, ALL_CITY_IDS } from '../types.js';

export async function getLocalAnnouncementsByAgencyTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const agency = args.agency as string | undefined;
    if (!agency || agency.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供機關名稱' }],
        isError: true,
      };
    }

    const city = args.city as CityId | undefined;
    const limit = (args.limit as number) ?? 20;
    const trimmed = agency.trim();

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

    const matched = all.filter((a) => a.agency.includes(trimmed));
    const page = matched.slice(0, limit);

    if (page.length === 0) {
      const cityLabel = city ? CITY_NAMES[city] : '六都';
      return {
        content: [
          {
            type: 'text',
            text: `在${cityLabel}查無「${trimmed}」機關的公告`,
          },
        ],
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
    const header = `${cityLabel}「${trimmed}」機關公告（共 ${matched.length} 筆，顯示 ${page.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `篩選機關公告失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
