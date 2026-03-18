import { fetchLyApi, ENDPOINTS } from '../client.js';
import type { Env, ToolResult, MeetingRecord } from '../types.js';

export async function searchMeetings(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    const committee = args.committee as string | undefined;
    const limit = (args.limit as number) ?? 20;

    const filters: Record<string, string> = {};
    if (committee) filters['committee'] = committee;

    const { records, total } = await fetchLyApi<MeetingRecord>(
      ENDPOINTS.MEETINGS,
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
        committee ? `委員會「${committee}」` : '',
      ]
        .filter(Boolean)
        .join('、');
      return {
        content: [
          {
            type: 'text',
            text: filterDesc
              ? `查無符合條件的會議紀錄（${filterDesc}）`
              : '查無會議紀錄',
          },
        ],
      };
    }

    const lines = records.map((r) => {
      return [
        `會議編號: ${r.meetingNo ?? '未知'}`,
        `  名稱: ${r.meetingName ?? '未知'}`,
        `  日期: ${r.meetingDate ?? '未知'}`,
        `  委員會: ${r.committee ?? '未知'}`,
        `  會議室: ${r.meetingRoom ?? '未知'}`,
        `  內容摘要: ${r.meetingContent ?? '未知'}`,
      ].join('\n');
    });

    const header = `委員會議事查詢（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢會議紀錄失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
