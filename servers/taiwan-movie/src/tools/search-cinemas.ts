import { fetchMovieData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchCinemas(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    if (!keyword || keyword.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供電影院/場所名稱關鍵字' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmed = keyword.trim();

    const data = await fetchMovieData();

    // Extract unique venues from showInfo
    const venueMap = new Map<string, { name: string; address: string; showCount: number }>();

    for (const record of data) {
      if (record.showInfo) {
        for (const show of record.showInfo) {
          const name = show.locationName ?? '';
          const address = show.location ?? '';
          if (name) {
            const key = name;
            const existing = venueMap.get(key);
            if (existing) {
              venueMap.set(key, { ...existing, showCount: existing.showCount + 1 });
            } else {
              venueMap.set(key, { name, address, showCount: 1 });
            }
          }
        }
      }
    }

    const allVenues = Array.from(venueMap.values());
    const matched = allVenues.filter(
      (v) => v.name.includes(trimmed) || v.address.includes(trimmed)
    );

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無名稱含「${trimmed}」的電影院/場所` },
        ],
      };
    }

    const sliced = matched.slice(0, limit);
    const lines = sliced.map((v) =>
      [
        `場所名稱: ${v.name}`,
        `  地址: ${v.address || '未知'}`,
        `  目前場次數: ${v.showCount}`,
      ].join('\n')
    );

    const header = `電影院/場所搜尋「${trimmed}」（共 ${matched.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋電影院/場所失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
