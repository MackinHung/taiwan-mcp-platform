import { fetchVitalStats, getDefaultYyyymm } from '../client.js';
import type { Env, ToolResult } from '../types.js';

function validateYyyymm(month: string): boolean {
  return /^\d{6}$/.test(month);
}

export async function getVitalStats(
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

    const records = await fetchVitalStats(month, county);

    if (!records || records.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `查無 ${month} 的生命統計資料${county ? `（${county}）` : ''}`,
        }],
      };
    }

    // Aggregate by county
    const countyMap = new Map<string, {
      birth: number;
      death: number;
      marry: number;
      divorce: number;
    }>();

    for (const r of records) {
      const cName = r.county ?? r.site_id ?? '未知';
      const existing = countyMap.get(cName) ?? { birth: 0, death: 0, marry: 0, divorce: 0 };
      countyMap.set(cName, {
        birth: existing.birth + (parseInt(r.birth_total ?? '0', 10) || 0),
        death: existing.death + (parseInt(r.death_total ?? '0', 10) || 0),
        marry: existing.marry + (parseInt(r.marry_pair ?? '0', 10) || 0),
        divorce: existing.divorce + (parseInt(r.divorce_pair ?? '0', 10) || 0),
      });
    }

    const year = month.slice(0, 4);
    const mon = month.slice(4, 6);
    const header = `${year}/${mon} 生命統計${county ? `（${county}）` : ''}`;

    const lines: string[] = [];
    let totalBirth = 0;
    let totalDeath = 0;
    let totalMarry = 0;
    let totalDivorce = 0;

    for (const [name, data] of countyMap) {
      totalBirth += data.birth;
      totalDeath += data.death;
      totalMarry += data.marry;
      totalDivorce += data.divorce;
      lines.push(
        `${name}: 出生 ${data.birth.toLocaleString()}、死亡 ${data.death.toLocaleString()}` +
        `、結婚 ${data.marry.toLocaleString()} 對、離婚 ${data.divorce.toLocaleString()} 對`
      );
    }

    const naturalGrowth = totalBirth - totalDeath;
    const growthSign = naturalGrowth >= 0 ? '+' : '';
    const summary =
      `\n合計: 出生 ${totalBirth.toLocaleString()}、死亡 ${totalDeath.toLocaleString()}` +
      `（自然增減 ${growthSign}${naturalGrowth.toLocaleString()}）` +
      `、結婚 ${totalMarry.toLocaleString()} 對、離婚 ${totalDivorce.toLocaleString()} 對`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}${county ? '' : summary}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得生命統計資料失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
