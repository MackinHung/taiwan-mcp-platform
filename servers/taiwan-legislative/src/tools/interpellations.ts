import { fetchLyApi, ENDPOINTS } from '../client.js';
import type { Env, ToolResult, InterpellationRecord } from '../types.js';

export async function getInterpellations(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    const legislator = args.legislator as string | undefined;
    const limit = (args.limit as number) ?? 20;

    const filters: Record<string, string> = {};
    if (legislator) filters['legislator'] = legislator;

    const { records, total } = await fetchLyApi<InterpellationRecord>(
      ENDPOINTS.INTERPELLATIONS,
      {
        query: keyword?.trim() || undefined,
        limit,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        apiKey: env.LY_API_KEY,
      }
    );

    if (!records || records.length === 0) {
      const filterDesc = [
        keyword ? `關鍵字「${keyword.trim()}」` : '',
        legislator ? `委員「${legislator}」` : '',
      ]
        .filter(Boolean)
        .join('、');
      return {
        content: [
          {
            type: 'text',
            text: filterDesc
              ? `查無符合條件的質詢紀錄（${filterDesc}）`
              : '查無質詢紀錄',
          },
        ],
      };
    }

    const lines = records.map((r) => {
      return [
        `質詢編號: ${r.interpellationNo ?? '未知'}`,
        `  委員: ${r.legislator ?? '未知'}`,
        `  主題: ${r.subject ?? '未知'}`,
        `  日期: ${r.meetingDate ?? '未知'}`,
        `  會期: ${r.sessionPeriod ?? '未知'}`,
        `  內容摘要: ${(r.content ?? '未知').substring(0, 200)}`,
      ].join('\n');
    });

    const header = `質詢紀錄查詢（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢質詢紀錄失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
