import { fetchPopulation, getDefaultYyyymm } from '../client.js';
import type { Env, ToolResult } from '../types.js';

function validateYyyymm(month: string): boolean {
  return /^\d{6}$/.test(month);
}

export async function compareRegions(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const counties = args.counties as string[] | undefined;
    const month = (args.month as string | undefined) ?? getDefaultYyyymm();

    if (!counties || !Array.isArray(counties) || counties.length < 2) {
      return {
        content: [{ type: 'text', text: '請提供至少 2 個縣市進行比較（如 ["臺北市", "新北市"]）' }],
        isError: true,
      };
    }

    if (!validateYyyymm(month)) {
      return {
        content: [{ type: 'text', text: '月份格式錯誤，請使用 YYYYMM 格式（如 202603）' }],
        isError: true,
      };
    }

    // Fetch data for each county in parallel
    const results = await Promise.allSettled(
      counties.map((c) => fetchPopulation(month, c))
    );

    const countyData: Array<{
      name: string;
      household: number;
      total: number;
      male: number;
      female: number;
    }> = [];

    for (let i = 0; i < counties.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value.length > 0) {
        let household = 0;
        let total = 0;
        let male = 0;
        let female = 0;

        for (const rec of r.value) {
          household += parseInt(rec.household ?? '0', 10) || 0;
          total += parseInt(rec.population_total ?? '0', 10) || 0;
          male += parseInt(rec.population_male ?? '0', 10) || 0;
          female += parseInt(rec.population_female ?? '0', 10) || 0;
        }

        countyData.push({ name: counties[i], household, total, male, female });
      } else {
        countyData.push({ name: counties[i], household: 0, total: 0, male: 0, female: 0 });
      }
    }

    if (countyData.every((d) => d.total === 0)) {
      return {
        content: [{
          type: 'text',
          text: `查無 ${month} 的人口資料（${counties.join('、')}）`,
        }],
      };
    }

    const year = month.slice(0, 4);
    const mon = month.slice(4, 6);
    const header = `${year}/${mon} 縣市人口比較（${counties.join(' vs ')})`;

    const lines: string[] = [];

    // Find max for ranking
    const sorted = [...countyData].sort((a, b) => b.total - a.total);

    for (const data of sorted) {
      const sexRatio = data.female > 0
        ? (data.male / data.female * 100).toFixed(1)
        : 'N/A';
      const avgPerHousehold = data.household > 0
        ? (data.total / data.household).toFixed(2)
        : '0.00';

      lines.push(
        `【${data.name}】\n` +
        `  人口: ${data.total.toLocaleString()} 人` +
        `（男 ${data.male.toLocaleString()}、女 ${data.female.toLocaleString()}）\n` +
        `  戶數: ${data.household.toLocaleString()}，每戶平均 ${avgPerHousehold} 人\n` +
        `  性別比: ${sexRatio}（男/百女）`
      );
    }

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `比較縣市人口失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
