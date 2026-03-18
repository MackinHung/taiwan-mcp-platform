import { fetchPmsApi } from '../client.js';
import type { Env, ToolResult, TenderRecord } from '../types.js';

function formatAwarded(r: TenderRecord): string {
  return [
    `標案編號: ${r.tenderId ?? r.tenderNo ?? r['標案編號'] ?? '未知'}`,
    `  名稱: ${r.tenderName ?? r['標案名稱'] ?? '未知'}`,
    `  機關: ${r.agency ?? r['機關名稱'] ?? '未知'}`,
    `  得標廠商: ${r.awardedVendor ?? r['得標廠商'] ?? '未知'}`,
    `  決標金額: ${r.awardedAmount ?? r['決標金額'] ?? '未知'}`,
    `  決標日期: ${r.awardDate ?? r['決標日期'] ?? '未知'}`,
  ].join('\n');
}

export async function getAwardedContracts(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    const agency = args.agency as string | undefined;
    const limit = (args.limit as number) ?? 20;

    const { records, total } = await fetchPmsApi({
      keyword: keyword?.trim() || undefined,
      agency: agency?.trim() || undefined,
      status: 'awarded',
      limit,
    });

    if (!records || records.length === 0) {
      const filterDesc = [
        keyword ? `關鍵字「${keyword.trim()}」` : '',
        agency ? `機關「${agency.trim()}」` : '',
      ]
        .filter(Boolean)
        .join('、');
      return {
        content: [
          {
            type: 'text',
            text: filterDesc
              ? `查無符合條件的決標公告（${filterDesc}）`
              : '查無決標公告',
          },
        ],
      };
    }

    const lines = records.map(formatAwarded);
    const header = `決標公告（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢決標公告失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
