import { fetchLyApi, ENDPOINTS } from '../client.js';
import type { Env, ToolResult, BillRecord } from '../types.js';

export async function getBillStatus(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const billId = args.billId as string | undefined;
    if (!billId || billId.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供法案編號 (billId)' }],
        isError: true,
      };
    }

    const { records } = await fetchLyApi<BillRecord>(ENDPOINTS.BILLS, {
      id: billId.trim(),
      apiKey: env.LY_API_KEY,
    });

    if (!records || records.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無法案編號「${billId.trim()}」的資料` },
        ],
      };
    }

    const r = records[0];
    const lines = [
      `法案編號: ${r.billNo ?? billId}`,
      `名稱: ${r.billName ?? '未知'}`,
      `提案人: ${r.billProposer ?? '未知'}`,
      `提案類型: ${r.proposerType ?? '未知'}`,
      `審議狀態: ${r.billStatus ?? '未知'}`,
      `會期: ${r.sessionPeriod ?? '未知'}`,
      `會議次: ${r.sessionTimes ?? '未知'}`,
      `文件連結: ${r.docUrl ?? '無'}`,
    ];

    return {
      content: [
        { type: 'text', text: `法案審議進度\n\n${lines.join('\n')}` },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得法案進度失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
