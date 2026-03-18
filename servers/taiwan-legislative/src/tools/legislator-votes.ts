import { fetchLyApi, ENDPOINTS } from '../client.js';
import type { Env, ToolResult, VoteRecord } from '../types.js';

export async function getLegislatorVotes(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const legislator = args.legislator as string | undefined;
    const term = args.term as number | undefined;
    const limit = (args.limit as number) ?? 20;

    const filters: Record<string, string | number> = {};
    if (legislator) filters['legislator'] = legislator;
    if (term) filters['term'] = term;

    const { records, total } = await fetchLyApi<VoteRecord>(
      `${ENDPOINTS.LEGISLATORS}/votes`,
      {
        limit,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        apiKey: env.LY_API_KEY,
      }
    );

    if (!records || records.length === 0) {
      const filterDesc = [
        legislator ? `委員「${legislator}」` : '',
        term ? `第 ${term} 屆` : '',
      ]
        .filter(Boolean)
        .join('、');
      return {
        content: [
          {
            type: 'text',
            text: filterDesc
              ? `查無符合條件的投票紀錄（${filterDesc}）`
              : '查無投票紀錄',
          },
        ],
      };
    }

    const lines = records.map((r) => {
      return [
        `投票編號: ${r.voteNo ?? '未知'}`,
        `  委員: ${r.legislator ?? '未知'}`,
        `  議案: ${r.subject ?? r.billNo ?? '未知'}`,
        `  投票結果: ${r.voteResult ?? '未知'}`,
        `  日期: ${r.voteDate ?? '未知'}`,
        `  會期: ${r.sessionPeriod ?? '未知'}`,
      ].join('\n');
    });

    const header = `委員投票紀錄（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得投票紀錄失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
