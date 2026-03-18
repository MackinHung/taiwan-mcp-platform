import { fetchPmsApi } from '../client.js';
import type { Env, ToolResult, TenderRecord } from '../types.js';

export async function getTenderDetails(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const tenderId = args.tenderId as string | undefined;
    if (!tenderId || tenderId.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供標案編號 (tenderId)' }],
        isError: true,
      };
    }

    const trimmedId = tenderId.trim();

    const { records } = await fetchPmsApi({
      keyword: trimmedId,
      limit: 10,
    });

    // Find exact match by tenderId, tenderNo, or 標案編號
    const match = records.find(
      (r: TenderRecord) =>
        r.tenderId === trimmedId ||
        r.tenderNo === trimmedId ||
        r['標案編號'] === trimmedId
    );

    const r = match ?? records[0];

    if (!r) {
      return {
        content: [
          { type: 'text', text: `查無標案編號「${trimmedId}」的資料` },
        ],
      };
    }

    const lines = [
      `標案編號: ${r.tenderId ?? r.tenderNo ?? r['標案編號'] ?? trimmedId}`,
      `名稱: ${r.tenderName ?? r['標案名稱'] ?? '未知'}`,
      `機關: ${r.agency ?? r['機關名稱'] ?? '未知'}`,
      `招標方式: ${r.tenderType ?? r['招標方式'] ?? '未知'}`,
      `狀態: ${r.tenderStatus ?? '未知'}`,
      `公告日期: ${r.publishDate ?? r['公告日期'] ?? '未知'}`,
      `截止日期: ${r.deadline ?? r['截止日期'] ?? '未知'}`,
      `預算金額: ${r.budget ?? r['預算金額'] ?? '未知'}`,
      `類別: ${r.category ?? '未知'}`,
      `說明: ${r.description ?? '未知'}`,
      `得標廠商: ${r.awardedVendor ?? r['得標廠商'] ?? '未知'}`,
      `決標金額: ${r.awardedAmount ?? r['決標金額'] ?? '未知'}`,
      `聯絡人: ${r.contactPerson ?? '未知'}`,
      `聯絡電話: ${r.contactPhone ?? '未知'}`,
    ];

    return {
      content: [
        { type: 'text', text: `標案詳細資訊\n\n${lines.join('\n')}` },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得標案詳情失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
