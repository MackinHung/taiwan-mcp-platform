import {
  fetchElectionList,
  fetchCandidates,
  normalizeElectionType,
  findElectionByYearAndType,
} from '../client.js';
import type { Env, ToolResult, ElectionType } from '../types.js';

export async function getElectionResults(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const typeRaw = args.type as string | undefined;
    const year = args.year as number | undefined;

    let electionType: ElectionType | undefined;
    if (typeRaw) {
      electionType = normalizeElectionType(typeRaw);
      if (!electionType) {
        return {
          content: [{
            type: 'text',
            text: `不支援的選舉類型「${typeRaw}」。支援類型：president（總統）、legislator（立委）、mayor（縣市長）、council（議員）、referendum（公投）`,
          }],
          isError: true,
        };
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

    const elections = fetchElectionList(electionType, year);

    if (elections.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `查無符合條件的選舉資料${year ? `（${year}年）` : ''}${electionType ? `（${electionType}）` : ''}`,
        }],
      };
    }

    const lines: string[] = [];
    for (const election of elections) {
      const candidates = fetchCandidates(election.electionName);
      const winner = candidates.find((c) => c.elected);

      let line = `${election.date} — ${election.electionName}`;
      if (winner) {
        line += `\n  當選人：${winner.name}（${winner.party}）得票 ${winner.votes.toLocaleString()} 票（${winner.voteRate}%）`;
      }
      if (candidates.length > 0 && !winner) {
        line += `\n  候選人共 ${candidates.length} 人`;
      }
      lines.push(line);
    }

    const typeLabel = electionType ?? '所有';
    const header = `${year ? `${year}年` : ''}${typeLabel !== '所有' ? typeLabel : ''}選舉結果（共 ${elections.length} 場）`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得選舉結果失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
