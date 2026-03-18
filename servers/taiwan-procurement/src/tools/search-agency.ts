import { fetchPmsApi } from '../client.js';
import type { Env, ToolResult, TenderRecord } from '../types.js';

function formatTender(r: TenderRecord): string {
  return [
    `標案編號: ${r.tenderId ?? r.tenderNo ?? r['標案編號'] ?? '未知'}`,
    `  名稱: ${r.tenderName ?? r['標案名稱'] ?? '未知'}`,
    `  機關: ${r.agency ?? r['機關名稱'] ?? '未知'}`,
    `  公告日期: ${r.publishDate ?? r['公告日期'] ?? '未知'}`,
    `  預算金額: ${r.budget ?? r['預算金額'] ?? '未知'}`,
    `  狀態: ${r.tenderStatus ?? '未知'}`,
  ].join('\n');
}

export async function searchByAgency(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const agency = args.agency as string | undefined;
    if (!agency || agency.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供機關名稱' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmedAgency = agency.trim();

    const { records, total } = await fetchPmsApi({
      agency: trimmedAgency,
      limit,
    });

    if (!records || records.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `查無機關「${trimmedAgency}」的標案資料`,
          },
        ],
      };
    }

    const lines = records.map(formatTender);
    const header = `機關「${trimmedAgency}」標案（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `依機關搜尋標案失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
