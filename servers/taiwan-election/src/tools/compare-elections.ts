import {
  fetchElectionList,
  fetchCandidates,
  fetchVotingStats,
  fetchPartyResults,
} from '../client.js';
import type { Env, ToolResult, ElectionRecord } from '../types.js';

export async function compareElections(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const election1 = args.election1 as string | number | undefined;
    const election2 = args.election2 as string | number | undefined;

    if (!election1 || !election2) {
      return {
        content: [{
          type: 'text',
          text: '請提供兩個要比較的選舉（election1 和 election2），可用年份數字或選舉名稱',
        }],
        isError: true,
      };
    }

    const e1 = resolveElection(election1);
    const e2 = resolveElection(election2);

    if (!e1) {
      return {
        content: [{
          type: 'text',
          text: `找不到選舉「${election1}」的資料`,
        }],
        isError: true,
      };
    }

    if (!e2) {
      return {
        content: [{
          type: 'text',
          text: `找不到選舉「${election2}」的資料`,
        }],
        isError: true,
      };
    }

    const sections: string[] = [];
    sections.push(`選舉比較：${e1.electionName} vs ${e2.electionName}`);
    sections.push('');

    // Basic info
    sections.push('【基本資訊】');
    sections.push(`${e1.electionName}：${e1.date}（${e1.electionType}）`);
    sections.push(`${e2.electionName}：${e2.date}（${e2.electionType}）`);
    sections.push('');

    // Candidates comparison
    const c1 = fetchCandidates(e1.electionName);
    const c2 = fetchCandidates(e2.electionName);

    if (c1.length > 0 || c2.length > 0) {
      sections.push('【候選人比較】');

      if (c1.length > 0) {
        const winner1 = c1.find((c) => c.elected);
        sections.push(`${e1.electionName}：${c1.length} 人`);
        if (winner1) {
          sections.push(`  當選：${winner1.name}（${winner1.party}）${winner1.voteRate}%`);
        }
      }

      if (c2.length > 0) {
        const winner2 = c2.find((c) => c.elected);
        sections.push(`${e2.electionName}：${c2.length} 人`);
        if (winner2) {
          sections.push(`  當選：${winner2.name}（${winner2.party}）${winner2.voteRate}%`);
        }
      }
      sections.push('');
    }

    // Voting stats comparison
    const v1 = fetchVotingStats(e1.electionYear);
    const v2 = fetchVotingStats(e2.electionYear);

    if (v1.length > 0 || v2.length > 0) {
      sections.push('【投票率比較】');

      if (v1.length > 0) {
        const total1 = v1.reduce((s, r) => s + r.totalVotes, 0);
        const eligible1 = v1.reduce((s, r) => s + r.eligibleVoters, 0);
        const turnout1 = eligible1 > 0
          ? ((total1 / eligible1) * 100).toFixed(2)
          : '0';
        sections.push(`${e1.electionYear}年：投票率 ${turnout1}%（${total1.toLocaleString()} / ${eligible1.toLocaleString()}）`);
      }

      if (v2.length > 0) {
        const total2 = v2.reduce((s, r) => s + r.totalVotes, 0);
        const eligible2 = v2.reduce((s, r) => s + r.eligibleVoters, 0);
        const turnout2 = eligible2 > 0
          ? ((total2 / eligible2) * 100).toFixed(2)
          : '0';
        sections.push(`${e2.electionYear}年：投票率 ${turnout2}%（${total2.toLocaleString()} / ${eligible2.toLocaleString()}）`);
      }

      if (v1.length > 0 && v2.length > 0) {
        const total1 = v1.reduce((s, r) => s + r.totalVotes, 0);
        const eligible1 = v1.reduce((s, r) => s + r.eligibleVoters, 0);
        const total2 = v2.reduce((s, r) => s + r.totalVotes, 0);
        const eligible2 = v2.reduce((s, r) => s + r.eligibleVoters, 0);
        const turnout1 = eligible1 > 0 ? (total1 / eligible1) * 100 : 0;
        const turnout2 = eligible2 > 0 ? (total2 / eligible2) * 100 : 0;
        const diff = (turnout1 - turnout2).toFixed(2);
        const direction = parseFloat(diff) > 0 ? '高' : '低';
        sections.push(`投票率差異：${e1.electionYear}年比${e2.electionYear}年${direction} ${Math.abs(parseFloat(diff))}%`);
      }
      sections.push('');
    }

    // Party results comparison
    const p1 = fetchPartyResults(e1.electionYear);
    const p2 = fetchPartyResults(e2.electionYear);

    if (p1.length > 0 && p2.length > 0) {
      sections.push('【政黨得票比較】');
      const allParties = new Set([
        ...p1.map((p) => p.party),
        ...p2.map((p) => p.party),
      ]);

      for (const party of allParties) {
        const r1 = p1.find((p) => p.party === party);
        const r2 = p2.find((p) => p.party === party);
        const v1Str = r1 ? `${r1.voteRate}%（${r1.seatsWon}席）` : '未參選';
        const v2Str = r2 ? `${r2.voteRate}%（${r2.seatsWon}席）` : '未參選';
        sections.push(`${party}：${e1.electionYear}年 ${v1Str} → ${e2.electionYear}年 ${v2Str}`);
      }
    }

    return {
      content: [{ type: 'text', text: sections.join('\n') }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `選舉比較失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}

function resolveElection(input: string | number): ElectionRecord | undefined {
  if (typeof input === 'number') {
    const elections = fetchElectionList(undefined, input);
    // Prefer presidential
    return (
      elections.find((e) => e.electionType === 'president') ?? elections[0]
    );
  }

  const str = String(input);

  // Try as year
  const yearMatch = str.match(/^(\d{4})$/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    const elections = fetchElectionList(undefined, year);
    return (
      elections.find((e) => e.electionType === 'president') ?? elections[0]
    );
  }

  // Try as name
  const allElections = fetchElectionList();
  return allElections.find((e) => e.electionName.includes(str));
}
