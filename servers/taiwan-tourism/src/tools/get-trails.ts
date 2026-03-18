import { fetchAttractions } from '../client.js';
import type { Env, ToolResult } from '../types.js';

const TRAIL_KEYWORDS = ['步道', '自行車道', '登山', '健行'];

export async function getTrails(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;
    const keyword = args.keyword as string | undefined;

    // Fetch attractions, using keyword or a trail-related search
    const searchKeyword = keyword || '步道';
    const { records, total } = await fetchAttractions({
      keyword: searchKeyword,
      city: city || undefined,
      limit: 50,
    });

    if (!records || records.length === 0) {
      const conditions: string[] = [];
      if (city) conditions.push(`城市「${city}」`);
      if (keyword) conditions.push(`關鍵字「${keyword}」`);
      const condStr = conditions.length > 0 ? conditions.join('、') : '目前條件';
      return {
        content: [{ type: 'text', text: `查無符合${condStr}的步道資料` }],
      };
    }

    // Filter by trail-related categories or names
    const trailRecords = records.filter((r) => {
      const name = r['Name'] ?? r['name'] ?? '';
      const category = r['Class1'] ?? r['Class'] ?? r['category'] ?? '';
      const desc = r['Description'] ?? r['description'] ?? '';
      const combined = `${name}${category}${desc}`;
      return TRAIL_KEYWORDS.some((kw) => combined.includes(kw));
    });

    // If keyword filter is too restrictive, fall back to all records
    const resultRecords = trailRecords.length > 0 ? trailRecords : records;

    const lines = resultRecords.map((r) => {
      const name = r['Name'] ?? r['name'] ?? '未知';
      const region = r['Region'] ?? r['region'] ?? '';
      const addr = r['Add'] ?? r['Address'] ?? r['address'] ?? '';
      const openTime = r['Opentime'] ?? r['openTime'] ?? '';
      const desc = r['Description'] ?? r['description'] ?? '';
      const truncDesc = desc.length > 80 ? desc.slice(0, 80) + '...' : desc;

      return `- ${name}${region ? ` (${region})` : ''}${addr ? `\n  地址: ${addr}` : ''}${openTime ? `\n  開放時間: ${openTime}` : ''}${truncDesc ? `\n  簡介: ${truncDesc}` : ''}`;
    });

    const header = `找到 ${resultRecords.length} 筆步道/自行車道資料`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `搜尋步道失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
