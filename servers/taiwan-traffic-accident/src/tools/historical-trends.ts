import { fetchAccidents } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getHistoricalTrends(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;

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

    if (records.length === 0) {
      return {
        content: [{ type: 'text', text: '查無事故資料，無法分析趨勢' }],
      };
    }

    // Group records by month (YYYY-MM)
    const byMonth: Record<string, { count: number; deaths: number; injuries: number }> = {};
    for (const r of records) {
      // occurDate format may vary: "2026/01/15" or "2026-01-15" or "20260115"
      let monthKey = '';
      if (r.occurDate.includes('/')) {
        const parts = r.occurDate.split('/');
        monthKey = `${parts[0]}-${parts[1].padStart(2, '0')}`;
      } else if (r.occurDate.includes('-')) {
        const parts = r.occurDate.split('-');
        monthKey = `${parts[0]}-${parts[1]}`;
      } else if (r.occurDate.length >= 6) {
        monthKey = `${r.occurDate.slice(0, 4)}-${r.occurDate.slice(4, 6)}`;
      } else {
        monthKey = '未知';
      }

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { count: 0, deaths: 0, injuries: 0 };
      }
      byMonth[monthKey].count += 1;
      byMonth[monthKey].deaths += r.deathCount;
      byMonth[monthKey].injuries += r.injuryCount;
    }

    // Sort by month
    const sorted = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));

    const locationStr = county ? `${county}` : '全國';
    const lines = [`${locationStr}交通事故月別趨勢`, ''];

    for (const [month, stats] of sorted) {
      lines.push(
        `${month}: ${stats.count} 件事故（死亡 ${stats.deaths}、受傷 ${stats.injuries}）`
      );
    }

    // Summary
    const totalCount = sorted.reduce((s, [, v]) => s + v.count, 0);
    const totalDeaths = sorted.reduce((s, [, v]) => s + v.deaths, 0);
    const totalInjuries = sorted.reduce((s, [, v]) => s + v.injuries, 0);
    const monthCount = sorted.length;
    const avgPerMonth = monthCount > 0 ? (totalCount / monthCount).toFixed(1) : '0';

    lines.push(
      '',
      '--- 摘要 ---',
      `涵蓋月份: ${monthCount} 個月`,
      `事故總數: ${totalCount} 件`,
      `死亡總數: ${totalDeaths} 人`,
      `受傷總數: ${totalInjuries} 人`,
      `月平均事故數: ${avgPerMonth} 件`
    );

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得事故趨勢資料失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
