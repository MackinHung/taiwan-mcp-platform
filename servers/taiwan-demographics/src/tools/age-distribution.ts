import { fetchAgeDistribution, getDefaultYyyymm } from '../client.js';
import type { Env, ToolResult } from '../types.js';

function validateYyyymm(month: string): boolean {
  return /^\d{6}$/.test(month);
}

export async function getAgeDistribution(
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

    const records = await fetchAgeDistribution(month, county);

    if (!records || records.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `查無 ${month} 的年齡分布資料${county ? `（${county}）` : ''}`,
        }],
      };
    }

    // Group by age ranges
    const ageGroups = new Map<string, { male: number; female: number; total: number }>();
    const AGE_RANGES = [
      { label: '0-14 歲', min: 0, max: 14 },
      { label: '15-64 歲', min: 15, max: 64 },
      { label: '65 歲以上', min: 65, max: 999 },
    ];

    for (const range of AGE_RANGES) {
      ageGroups.set(range.label, { male: 0, female: 0, total: 0 });
    }

    for (const r of records) {
      const ageStr = r.age ?? r.people_age ?? '';
      const age = parseInt(ageStr, 10);
      if (isNaN(age)) continue;

      const male = parseInt(r.population_male ?? r.people_male ?? '0', 10) || 0;
      const female = parseInt(r.population_female ?? r.people_female ?? '0', 10) || 0;
      const total = male + female;

      for (const range of AGE_RANGES) {
        if (age >= range.min && age <= range.max) {
          const group = ageGroups.get(range.label)!;
          ageGroups.set(range.label, {
            male: group.male + male,
            female: group.female + female,
            total: group.total + total,
          });
          break;
        }
      }
    }

    const year = month.slice(0, 4);
    const mon = month.slice(4, 6);
    const header = `${year}/${mon} 年齡分布${county ? `（${county}）` : ''}`;

    const grandTotal = [...ageGroups.values()].reduce((sum, g) => sum + g.total, 0);

    const lines: string[] = [];
    for (const [label, data] of ageGroups) {
      const pct = grandTotal > 0 ? ((data.total / grandTotal) * 100).toFixed(1) : '0.0';
      lines.push(
        `${label}: ${data.total.toLocaleString()} 人（${pct}%）` +
        `（男 ${data.male.toLocaleString()}、女 ${data.female.toLocaleString()}）`
      );
    }

    const summary = `\n合計: ${grandTotal.toLocaleString()} 人`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}${summary}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得年齡分布資料失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
