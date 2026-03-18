import { fetchPartyResults } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getPartyResults(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const election = args.election as string | number | undefined;

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

    const results = fetchPartyResults(year);

    if (results.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `查無${year ? ` ${year}年` : ''}政黨得票資料。目前有資料的年度：2024、2020`,
        }],
      };
    }

    const totalVotes = results.reduce((s, r) => s + r.totalVotes, 0);
    const totalSeats = results.reduce((s, r) => s + r.seatsWon, 0);

    const header = `${year ?? 2024}年政黨得票分析（立委選舉）`;

    const summary = [
      `總投票數：${totalVotes.toLocaleString()} 票`,
      `總席次：${totalSeats} 席`,
    ].join('\n');

    const partyLines = results.map((r) =>
      [
        `${r.party}`,
        `  得票：${r.totalVotes.toLocaleString()} 票（${r.voteRate}%）`,
        `  席次：${r.seatsWon} 席`,
        `  提名候選人：${r.candidates} 人`,
      ].join('\n')
    );

    return {
      content: [{
        type: 'text',
        text: `${header}\n\n${summary}\n\n${partyLines.join('\n\n')}`,
      }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得政黨得票資料失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
