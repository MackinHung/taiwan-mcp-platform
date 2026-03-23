import { fetchMuseumData } from '../client.js';
import type { Env, ToolResult, MuseumRecord } from '../types.js';

export async function searchMuseums(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    if (!keyword || keyword.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供博物館名稱關鍵字' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmed = keyword.trim();

    const data = await fetchMuseumData();

    // Filter records matching keyword in title, showUnit, or location
    const matched = data.filter(
      (r) =>
        (r.title && r.title.includes(trimmed)) ||
        (r.showUnit && r.showUnit.includes(trimmed)) ||
        (r.location && r.location.includes(trimmed))
    );

    // Deduplicate by unique venue names from showInfo[].locationName
    const venueMap = new Map<string, MuseumRecord>();
    for (const record of matched) {
      if (record.showInfo) {
        for (const info of record.showInfo) {
          if (info.locationName && !venueMap.has(info.locationName)) {
            venueMap.set(info.locationName, record);
          }
        }
      }
      // Also add by showUnit if no showInfo
      if (record.showUnit && !venueMap.has(record.showUnit)) {
        venueMap.set(record.showUnit, record);
      }
    }

    if (venueMap.size === 0) {
      return {
        content: [
          { type: 'text', text: `查無名稱含「${trimmed}」的博物館` },
        ],
      };
    }

    const venues = Array.from(venueMap.entries()).slice(0, limit);
    const lines = venues.map(([venueName, record]) => {
      const address = record.showInfo?.[0]?.location ?? '未知';
      const website = record.sourceWebPromote ?? '未知';
      return [
        `場館: ${venueName}`,
        `  地址: ${address}`,
        `  網站: ${website}`,
      ].join('\n');
    });

    const header = `博物館搜尋「${trimmed}」（共 ${venueMap.size} 間，顯示 ${venues.length} 間）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋博物館失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
