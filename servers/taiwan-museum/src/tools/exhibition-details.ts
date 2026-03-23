import { fetchMuseumData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getExhibitionDetails(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const title = args.title as string | undefined;
    if (!title || title.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供展覽標題' }],
        isError: true,
      };
    }

    const trimmed = title.trim();
    const data = await fetchMuseumData();
    const found = data.find(
      (r) => r.title && r.title.includes(trimmed)
    );

    if (!found) {
      return {
        content: [
          { type: 'text', text: `查無標題含「${trimmed}」的展覽詳細資訊` },
        ],
      };
    }

    const lines = [
      `=== 展覽完整資訊 ===`,
      `展覽名稱: ${found.title ?? '未知'}`,
      ``,
      `【展覽期間】`,
      `  開始日期: ${found.startDate ?? '未知'}`,
      `  結束日期: ${found.endDate ?? '未知'}`,
      ``,
      `【主辦單位】`,
      `  主辦: ${found.masterUnit?.join('、') ?? '未知'}`,
      `  執行單位: ${found.showUnit ?? '未知'}`,
      ``,
      `【展覽地點】`,
    ];

    if (found.showInfo && found.showInfo.length > 0) {
      for (const info of found.showInfo) {
        lines.push(`  場館: ${info.locationName ?? '未知'}`);
        lines.push(`  地址: ${info.location ?? '未知'}`);
        lines.push(`  時間: ${info.time ?? '未知'}`);
        lines.push(`  票價: ${info.price ?? '未知'}`);
        lines.push('');
      }
    } else {
      lines.push(`  地點: ${found.location ?? '未知'}`);
      lines.push('');
    }

    lines.push(`【展覽說明】`);
    lines.push(`  ${found.descriptionFilterHtml ?? '無說明'}`);
    lines.push('');
    lines.push(`【其他資訊】`);
    lines.push(`  官方網站: ${found.sourceWebPromote ?? '未知'}`);
    lines.push(`  瀏覽次數: ${found.hitRate ?? '未知'}`);
    lines.push(`  分類: ${found.category ?? '未知'}`);

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得展覽詳細資訊失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
