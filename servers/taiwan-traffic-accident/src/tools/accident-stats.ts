import { fetchAccidents } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getAccidentStats(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;
    const period = args.period as string | undefined;

    if (county !== undefined && (typeof county !== 'string' || county.trim() === '')) {
      return {
        content: [{ type: 'text', text: '縣市名稱格式不正確' }],
        isError: true,
      };
    }

    const fetchParams: { county?: string; limit: number } = { limit: 100 };
    if (county) {
      fetchParams.county = county.trim();
    }

    const { records } = await fetchAccidents(fetchParams);

    // Filter by period if provided (format: YYYY-MM or YYYY)
    const filtered = period
      ? records.filter((r) => r.occurDate.startsWith(period))
      : records;

    if (filtered.length === 0) {
      return {
        content: [{ type: 'text', text: '查無符合條件的事故統計資料' }],
      };
    }

    const totalAccidents = filtered.length;
    const totalDeaths = filtered.reduce((sum, r) => sum + r.deathCount, 0);
    const totalInjuries = filtered.reduce((sum, r) => sum + r.injuryCount, 0);

    // Group by accident type
    const byType: Record<string, { count: number; deaths: number; injuries: number }> = {};
    for (const r of filtered) {
      const type = r.accidentType || '未分類';
      if (!byType[type]) {
        byType[type] = { count: 0, deaths: 0, injuries: 0 };
      }
      byType[type].count += 1;
      byType[type].deaths += r.deathCount;
      byType[type].injuries += r.injuryCount;
    }

    // Group by cause (top 5)
    const byCause: Record<string, number> = {};
    for (const r of filtered) {
      const cause = r.cause || '未知';
      byCause[cause] = (byCause[cause] ?? 0) + 1;
    }
    const topCauses = Object.entries(byCause)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const locationStr = county ? `${county}` : '全國';
    const periodStr = period ? `（${period}）` : '';

    const lines = [
      `${locationStr}交通事故統計${periodStr}`,
      '',
      `事故總數: ${totalAccidents} 件`,
      `死亡人數: ${totalDeaths} 人`,
      `受傷人數: ${totalInjuries} 人`,
      '',
      '--- 依事故類型 ---',
    ];

    for (const [type, stats] of Object.entries(byType)) {
      lines.push(`${type}: ${stats.count} 件（死亡 ${stats.deaths}、受傷 ${stats.injuries}）`);
    }

    lines.push('', '--- 主要肇事原因 (Top 5) ---');
    for (const [cause, count] of topCauses) {
      lines.push(`${cause}: ${count} 件`);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得事故統計失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
