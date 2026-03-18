import { fetchUniversities } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchUniversities(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    const city = args.city as string | undefined;
    const type = args.type as string | undefined;

    if (!keyword && !city && !type) {
      return {
        content: [{ type: 'text', text: '請至少提供一個搜尋條件（關鍵字、縣市或類型）' }],
        isError: true,
      };
    }

    const records = await fetchUniversities({ keyword, city, type });

    if (records.length === 0) {
      const conditions = [
        keyword ? `關鍵字「${keyword}」` : '',
        city ? `縣市「${city}」` : '',
        type ? `類型「${type}」` : '',
      ].filter(Boolean).join('、');
      return {
        content: [{ type: 'text', text: `查無符合條件的大專校院（${conditions}）` }],
      };
    }

    // Limit results to 50 for readability
    const limited = records.slice(0, 50);
    const lines = limited.map((r) =>
      `${r.name}（${r.publicPrivate}）— ${r.city} | 電話: ${r.phone}`
    );

    const header = `搜尋結果：共 ${records.length} 所大專校院${records.length > 50 ? '（顯示前 50 所）' : ''}`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `搜尋大專校院失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
