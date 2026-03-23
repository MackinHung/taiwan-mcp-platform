import { fetchCityAnnouncements } from '../clients/index.js';
import type { Env, ToolResult, CityId } from '../types.js';
import { CITY_NAMES, ALL_CITY_IDS } from '../types.js';

export async function getLocalAnnounceStatsTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const cityStats: Array<{
      city: CityId;
      name: string;
      count: number;
      latestDate: string;
      agencies: number;
      error?: string;
    }> = [];

    const results = await Promise.allSettled(
      ALL_CITY_IDS.map(async (cityId) => {
        const announcements = await fetchCityAnnouncements(cityId);
        const agencies = new Set(announcements.map((a) => a.agency));
        const sorted = [...announcements].sort((a, b) =>
          b.date.localeCompare(a.date)
        );
        return {
          city: cityId,
          name: CITY_NAMES[cityId],
          count: announcements.length,
          latestDate: sorted[0]?.date ?? '無資料',
          agencies: agencies.size,
        };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        cityStats.push(result.value);
      } else {
        const idx = results.indexOf(result);
        const cityId = ALL_CITY_IDS[idx];
        cityStats.push({
          city: cityId,
          name: CITY_NAMES[cityId],
          count: 0,
          latestDate: '無資料',
          agencies: 0,
          error: (result.reason as Error).message,
        });
      }
    }

    const totalCount = cityStats.reduce((sum, s) => sum + s.count, 0);

    const lines = cityStats.map((s) => {
      const status = s.error ? ` (錯誤: ${s.error})` : '';
      return [
        `${s.name}:`,
        `  公告數: ${s.count}`,
        `  最新日期: ${s.latestDate}`,
        `  發布機關數: ${s.agencies}${status}`,
      ].join('\n');
    });

    const header = `六都地方公告統計（共 ${totalCount} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得統計失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
