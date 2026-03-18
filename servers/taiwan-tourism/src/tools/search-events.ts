import { fetchEvents } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchEvents(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    const city = args.city as string | undefined;
    const limit = args.limit as number | undefined;

    if (limit !== undefined && (typeof limit !== 'number' || limit < 1 || limit > 100)) {
      return {
        content: [{ type: 'text', text: 'limit 須為 1-100 之間的數字' }],
        isError: true,
      };
    }

    const { records, total } = await fetchEvents({
      keyword: keyword || undefined,
      city: city || undefined,
      limit: limit ?? 20,
    });

    if (!records || records.length === 0) {
      const conditions: string[] = [];
      if (keyword) conditions.push(`關鍵字「${keyword}」`);
      if (city) conditions.push(`城市「${city}」`);
      const condStr = conditions.length > 0 ? conditions.join('、') : '目前條件';
      return {
        content: [{ type: 'text', text: `查無符合${condStr}的活動資料` }],
      };
    }

    const lines = records.map((r) => {
      const name = r['Name'] ?? r['name'] ?? '未知';
      const region = r['Region'] ?? r['region'] ?? '';
      const start = r['Start'] ?? r['startDate'] ?? '';
      const end = r['End'] ?? r['endDate'] ?? '';
      const location = r['Location'] ?? r['location'] ?? '';
      const desc = r['Description'] ?? r['description'] ?? '';
      const truncDesc = desc.length > 80 ? desc.slice(0, 80) + '...' : desc;

      const datePart = start || end ? `\n  日期: ${start}${end ? ` ~ ${end}` : ''}` : '';
      return `- ${name}${region ? ` (${region})` : ''}${datePart}${location ? `\n  地點: ${location}` : ''}${truncDesc ? `\n  簡介: ${truncDesc}` : ''}`;
    });

    const header = `找到 ${total} 筆活動資料（顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `搜尋活動失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
