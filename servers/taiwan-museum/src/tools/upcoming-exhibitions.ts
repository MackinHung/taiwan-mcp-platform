import { fetchMuseumData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getUpcomingExhibitions(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = (args.limit as number) ?? 20;
    const today = new Date().toISOString().slice(0, 10);

    const data = await fetchMuseumData();

    // Filter exhibitions where startDate > today or endDate > today
    const upcoming = data.filter(
      (r) =>
        (r.startDate && r.startDate >= today) ||
        (r.endDate && r.endDate >= today)
    );

    if (upcoming.length === 0) {
      return {
        content: [
          { type: 'text', text: '目前查無即將開展的展覽' },
        ],
      };
    }

    // Sort by startDate ascending
    const sorted = [...upcoming].sort((a, b) => {
      const dateA = a.startDate ?? '9999-12-31';
      const dateB = b.startDate ?? '9999-12-31';
      return dateA.localeCompare(dateB);
    });

    const sliced = sorted.slice(0, limit);
    const lines = sliced.map((r) => {
      const venue = r.showInfo?.[0]?.locationName ?? r.showUnit ?? '未知';
      return [
        `展覽: ${r.title ?? '未知'}`,
        `  場館: ${venue}`,
        `  期間: ${r.startDate ?? '未知'} ~ ${r.endDate ?? '未知'}`,
        `  地點: ${r.location ?? '未知'}`,
      ].join('\n');
    });

    const header = `即將開展的展覽（共 ${upcoming.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得即將開展展覽失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
