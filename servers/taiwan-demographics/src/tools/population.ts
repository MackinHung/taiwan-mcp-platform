import { fetchPopulation, getDefaultYyyymm } from '../client.js';
import type { Env, ToolResult } from '../types.js';

function validateYyyymm(month: string): boolean {
  return /^\d{6}$/.test(month);
}

export async function getPopulation(
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
          text: `查無 ${month} 的人口資料${county ? `（${county}）` : ''}`,
        }],
      };
    }

    // Aggregate by county
    const countyMap = new Map<string, {
      household: number;
      total: number;
      male: number;
      female: number;
    }>();

    for (const r of records) {
      const cName = r.county ?? r.site_id ?? '未知';
      const existing = countyMap.get(cName) ?? { household: 0, total: 0, male: 0, female: 0 };
      countyMap.set(cName, {
        household: existing.household + (parseInt(r.household ?? '0', 10) || 0),
        total: existing.total + (parseInt(r.population_total ?? '0', 10) || 0),
        male: existing.male + (parseInt(r.population_male ?? '0', 10) || 0),
        female: existing.female + (parseInt(r.population_female ?? '0', 10) || 0),
      });
    }

    const year = month.slice(0, 4);
    const mon = month.slice(4, 6);
    const header = `${year}/${mon} 人口統計${county ? `（${county}）` : ''}`;

    const lines: string[] = [];
    let grandTotal = 0;

    for (const [name, data] of countyMap) {
      grandTotal += data.total;
      lines.push(
        `${name}: 人口 ${data.total.toLocaleString()} 人` +
        `（男 ${data.male.toLocaleString()}、女 ${data.female.toLocaleString()}）` +
        `，戶數 ${data.household.toLocaleString()}`
      );
    }

    const summary = `\n合計: ${grandTotal.toLocaleString()} 人，共 ${countyMap.size} 個縣市`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}${county ? '' : summary}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得人口資料失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
