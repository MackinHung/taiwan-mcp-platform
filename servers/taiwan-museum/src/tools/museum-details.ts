import { fetchMuseumData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getMuseumDetails(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const name = args.name as string | undefined;
    if (!name || name.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供博物館名稱' }],
        isError: true,
      };
    }

    const trimmed = name.trim();
    const data = await fetchMuseumData();

    // Find records associated with this museum venue
    const related = data.filter(
      (r) =>
        (r.showUnit && r.showUnit.includes(trimmed)) ||
        (r.showInfo?.some((info) => info.locationName?.includes(trimmed)))
    );

    if (related.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無「${trimmed}」的博物館資訊` },
        ],
      };
    }

    // Use first record for venue info
    const primary = related[0];
    const venueInfo = primary.showInfo?.[0];

    const lines = [
      `=== 博物館資訊 ===`,
      `場館名稱: ${venueInfo?.locationName ?? primary.showUnit ?? trimmed}`,
      `地址: ${venueInfo?.location ?? '未知'}`,
      `網站: ${primary.sourceWebPromote ?? '未知'}`,
      `主辦單位: ${primary.masterUnit?.join('、') ?? '未知'}`,
      ``,
      `【目前展覽】（共 ${related.length} 檔）`,
    ];

    for (const record of related.slice(0, 10)) {
      lines.push(`  - ${record.title ?? '未知展覽'}`);
      lines.push(`    期間: ${record.startDate ?? '未知'} ~ ${record.endDate ?? '未知'}`);
      if (record.showInfo?.[0]?.price) {
        lines.push(`    票價: ${record.showInfo[0].price}`);
      }
    }

    if (related.length > 10) {
      lines.push(`  ... 還有 ${related.length - 10} 檔展覽`);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得博物館資訊失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
