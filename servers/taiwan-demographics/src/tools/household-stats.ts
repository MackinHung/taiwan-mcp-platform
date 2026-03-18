import { fetchPopulation, getDefaultYyyymm } from '../client.js';
import type { Env, ToolResult } from '../types.js';

function validateYyyymm(month: string): boolean {
  return /^\d{6}$/.test(month);
}

export async function getHouseholdStats(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;
    const month = (args.month as string | undefined) ?? getDefaultYyyymm();

    if (!validateYyyymm(month)) {
      return {
        content: [{ type: 'text', text: '月份格式錯誤，請使用 YYYYMM 格式（如 202603）' }],
        isError: true,
      };
    }

    const records = await fetchPopulation(month, county);

    if (!records || records.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `查無 ${month} 的戶數資料${county ? `（${county}）` : ''}`,
        }],
      };
    }

    // Aggregate by county
    const countyMap = new Map<string, {
      household: number;
      population: number;
    }>();

    for (const r of records) {
      const cName = r.county ?? r.site_id ?? '未知';
      const existing = countyMap.get(cName) ?? { household: 0, population: 0 };
      countyMap.set(cName, {
        household: existing.household + (parseInt(r.household ?? '0', 10) || 0),
        population: existing.population + (parseInt(r.population_total ?? '0', 10) || 0),
      });
    }

    const year = month.slice(0, 4);
    const mon = month.slice(4, 6);
    const header = `${year}/${mon} 戶數統計${county ? `（${county}）` : ''}`;

    const lines: string[] = [];
    let totalHousehold = 0;
    let totalPopulation = 0;

    for (const [name, data] of countyMap) {
      totalHousehold += data.household;
      totalPopulation += data.population;
      const avgPerHousehold = data.household > 0
        ? (data.population / data.household).toFixed(2)
        : '0.00';
      lines.push(
        `${name}: 戶數 ${data.household.toLocaleString()}` +
        `，人口 ${data.population.toLocaleString()}` +
        `，每戶平均 ${avgPerHousehold} 人`
      );
    }

    const avgTotal = totalHousehold > 0
      ? (totalPopulation / totalHousehold).toFixed(2)
      : '0.00';
    const summary =
      `\n合計: 戶數 ${totalHousehold.toLocaleString()}` +
      `，人口 ${totalPopulation.toLocaleString()}` +
      `，每戶平均 ${avgTotal} 人`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}${county ? '' : summary}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得戶數資料失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
