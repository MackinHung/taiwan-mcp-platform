import { fetchPmsApi } from '../client.js';
import type { Env, ToolResult, TenderRecord } from '../types.js';

function formatTender(r: TenderRecord): string {
  return [
    `標案編號: ${r.tenderId ?? r.tenderNo ?? r['標案編號'] ?? '未知'}`,
    `  名稱: ${r.tenderName ?? r['標案名稱'] ?? '未知'}`,
    `  機關: ${r.agency ?? r['機關名稱'] ?? '未知'}`,
    `  公告日期: ${r.publishDate ?? r['公告日期'] ?? '未知'}`,
    `  截止日期: ${r.deadline ?? r['截止日期'] ?? '未知'}`,
    `  預算金額: ${r.budget ?? r['預算金額'] ?? '未知'}`,
  ].join('\n');
}

export async function getRecentTenders(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = (args.limit as number) ?? 20;

    const { records, total } = await fetchPmsApi({
      limit,
    });

    if (!records || records.length === 0) {
      return {
        content: [
          { type: 'text', text: '目前查無最新公告標案' },
        ],
      };
    }

    const lines = records.map(formatTender);
    const header = `最新公告標案（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得最新公告失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
