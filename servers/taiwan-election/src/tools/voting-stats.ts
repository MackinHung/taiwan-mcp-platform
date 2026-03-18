import { fetchVotingStats, getAvailablePresidentialYears } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getVotingStats(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const election = args.election as string | number | undefined;
    const county = args.county as string | undefined;

    let year: number | undefined;

    if (election !== undefined) {
      if (typeof election === 'number') {
        year = election;
      } else if (typeof election === 'string') {
        const parsed = parseInt(election, 10);
        if (!isNaN(parsed)) {
          year = parsed;
        }
      }

      if (year && (year < 1996 || year > 2026)) {
        return {
          content: [{
            type: 'text',
            text: '年度需在 1996-2026 之間',
          }],
          isError: true,
        };
      }
    }

    const stats = fetchVotingStats(year, county);

    if (stats.length === 0) {
      const availableYears = getAvailablePresidentialYears();
      const available = availableYears.filter(
        (y) => fetchVotingStats(y).length > 0
      );
      return {
        content: [{
          type: 'text',
          text: `查無符合條件的投票統計資料${year ? `（${year}年）` : ''}${county ? `（${county}）` : ''}。目前有資料的年度：${available.join('、')}`,
        }],
      };
    }

    const totalEligible = stats.reduce((s, r) => s + r.eligibleVoters, 0);
    const totalVotes = stats.reduce((s, r) => s + r.totalVotes, 0);
    const totalValid = stats.reduce((s, r) => s + r.validVotes, 0);
    const totalInvalid = stats.reduce((s, r) => s + r.invalidVotes, 0);
    const overallTurnout = totalEligible > 0
      ? ((totalVotes / totalEligible) * 100).toFixed(2)
      : '0';

    const header = `${year ? `${year}年` : ''}投票統計${county ? `（${county}）` : ''}`;

    const summary = [
      `全體有效選舉人：${totalEligible.toLocaleString()} 人`,
      `總投票數：${totalVotes.toLocaleString()} 票`,
      `投票率：${overallTurnout}%`,
      `有效票：${totalValid.toLocaleString()} 票`,
      `無效票：${totalInvalid.toLocaleString()} 票`,
    ].join('\n');

    const countyLines = stats.map((s) =>
      `${s.county}：投票率 ${s.turnoutRate}%（${s.totalVotes.toLocaleString()}/${s.eligibleVoters.toLocaleString()}）`
    );

    const body = stats.length === 1
      ? `${stats[0].county}\n\n${summary}`
      : `${summary}\n\n各縣市統計：\n${countyLines.join('\n')}`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${body}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得投票統計失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
