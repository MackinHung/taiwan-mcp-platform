import {
  fetchCandidates,
  fetchElectionList,
  normalizeElectionType,
} from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchCandidates(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const name = args.name as string | undefined;
    const party = args.party as string | undefined;
    const election = args.election as string | undefined;

    if (!name && !party && !election) {
      return {
        content: [{
          type: 'text',
          text: '請至少提供一個搜尋條件：name（候選人姓名）、party（政黨）、election（選舉名稱或年份）',
        }],
        isError: true,
      };
    }

    let electionName: string | undefined;

    if (election) {
      // Try to match election by name or year+type
      const yearMatch = election.match(/^(\d{4})$/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1], 10);
        const elections = fetchElectionList(undefined, year);
        if (elections.length > 0) {
          // Get candidates from all elections of that year
          let allCandidates = elections.flatMap((e) =>
            fetchCandidates(e.electionName)
          );

          if (name) {
            allCandidates = allCandidates.filter((c) =>
              c.name.includes(name)
            );
          }
          if (party) {
            allCandidates = allCandidates.filter((c) =>
              c.party.includes(party)
            );
          }

          if (allCandidates.length === 0) {
            return {
              content: [{
                type: 'text',
                text: `查無符合條件的候選人資料（${year}年）`,
              }],
            };
          }

          return {
            content: [{
              type: 'text',
              text: formatCandidateResults(allCandidates),
            }],
          };
        }
      }

      // Try matching by type keyword
      const type = normalizeElectionType(election);
      if (type) {
        const elections = fetchElectionList(type);
        if (elections.length > 0) {
          electionName = elections[0].electionName; // latest
        }
      }

      // Direct name match
      if (!electionName) {
        const allElections = fetchElectionList();
        const matched = allElections.find((e) =>
          e.electionName.includes(election)
        );
        if (matched) {
          electionName = matched.electionName;
        }
      }
    }

    // Build keyword from name/party
    const keyword = name ?? party;
    let candidates = fetchCandidates(electionName, keyword);

    // Additional filter if both name and party provided
    if (name && party) {
      candidates = candidates.filter(
        (c) => c.name.includes(name) && c.party.includes(party)
      );
    }

    if (candidates.length === 0) {
      const criteria: string[] = [];
      if (name) criteria.push(`姓名「${name}」`);
      if (party) criteria.push(`政黨「${party}」`);
      if (election) criteria.push(`選舉「${election}」`);
      return {
        content: [{
          type: 'text',
          text: `查無符合條件的候選人（${criteria.join('、')}）`,
        }],
      };
    }

    return {
      content: [{
        type: 'text',
        text: formatCandidateResults(candidates),
      }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `搜尋候選人失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}

function formatCandidateResults(candidates: ReturnType<typeof fetchCandidates>): string {
  const header = `候選人搜尋結果（共 ${candidates.length} 筆）`;

  const lines = candidates.map((c) => {
    const status = c.elected ? '✓ 當選' : '✗ 未當選';
    return [
      `${c.number}號 ${c.name}（${c.party}）`,
      `  選舉：${c.electionName}`,
      `  選區：${c.constituency}`,
      `  得票：${c.votes.toLocaleString()} 票（${c.voteRate}%）${status}`,
    ].join('\n');
  });

  return `${header}\n\n${lines.join('\n\n')}`;
}
