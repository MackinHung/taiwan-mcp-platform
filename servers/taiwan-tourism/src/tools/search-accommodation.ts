import { fetchAccommodation } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchAccommodation(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;
    const grade = args.grade as string | undefined;
    const limit = args.limit as number | undefined;

    if (limit !== undefined && (typeof limit !== 'number' || limit < 1 || limit > 100)) {
      return {
        content: [{ type: 'text', text: 'limit 須為 1-100 之間的數字' }],
        isError: true,
      };
    }

    const { records, total } = await fetchAccommodation({
      city: city || undefined,
      limit: limit ?? 20,
    });

    if (!records || records.length === 0) {
      const conditions: string[] = [];
      if (city) conditions.push(`城市「${city}」`);
      if (grade) conditions.push(`等級「${grade}」`);
      const condStr = conditions.length > 0 ? conditions.join('、') : '目前條件';
      return {
        content: [{ type: 'text', text: `查無符合${condStr}的住宿資料` }],
      };
    }

    // Filter by grade locally if specified
    const filtered = grade
      ? records.filter((r) => {
          const g = r['Grade'] ?? r['grade'] ?? '';
          return g.includes(grade);
        })
      : records;

    if (filtered.length === 0) {
      return {
        content: [{ type: 'text', text: `查無符合等級「${grade}」的住宿資料` }],
      };
    }

    const lines = filtered.map((r) => {
      const name = r['Name'] ?? r['name'] ?? '未知';
      const region = r['Region'] ?? r['region'] ?? '';
      const addr = r['Add'] ?? r['Address'] ?? r['address'] ?? '';
      const phone = r['Phone'] ?? r['Tel'] ?? r['phone'] ?? '';
      const g = r['Grade'] ?? r['grade'] ?? '';
      const price = r['Spec'] ?? r['Price'] ?? r['priceRange'] ?? '';

      return `- ${name}${region ? ` (${region})` : ''}${g ? `\n  等級: ${g}` : ''}${addr ? `\n  地址: ${addr}` : ''}${phone ? `\n  電話: ${phone}` : ''}${price ? `\n  價格: ${price}` : ''}`;
    });

    const header = `找到 ${total} 筆住宿資料（顯示 ${filtered.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `搜尋住宿失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
