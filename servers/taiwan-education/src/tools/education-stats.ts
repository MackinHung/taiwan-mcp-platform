import { fetchUniversities, fetchJuniorHighSchools, fetchHighSchools } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getEducationStats(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;

    const params = city ? { city } : undefined;

    const [universities, juniorHighs, highSchools] = await Promise.all([
      fetchUniversities(params),
      fetchJuniorHighSchools(params),
      fetchHighSchools(params),
    ]);

    const totalCount = universities.length + juniorHighs.length + highSchools.length;

    if (totalCount === 0 && city) {
      return {
        content: [{
          type: 'text',
          text: `查無「${city}」的學校統計資料，請確認縣市名稱是否正確`,
        }],
      };
    }

    // Count public/private for each level
    const countByType = (records: Array<{ publicPrivate: string }>) => ({
      total: records.length,
      public: records.filter((r) => r.publicPrivate.includes('公')).length,
      private: records.filter((r) => r.publicPrivate.includes('私')).length,
    });

    const uniStats = countByType(universities);
    const jhStats = countByType(juniorHighs);
    const hsStats = countByType(highSchools);

    // Top cities
    const cityCount: Record<string, number> = {};
    for (const r of [...universities, ...juniorHighs, ...highSchools]) {
      const c = (r as { city: string }).city;
      cityCount[c] = (cityCount[c] ?? 0) + 1;
    }
    const topCities = Object.entries(cityCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([c, n]) => `${c}: ${n} 所`);

    const stats = {
      scope: city ?? '全國',
      total: totalCount,
      breakdown: {
        大專校院: uniStats,
        國民中學: jhStats,
        高級中等學校: hsStats,
      },
      topCities: city ? undefined : topCities,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得教育統計失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
