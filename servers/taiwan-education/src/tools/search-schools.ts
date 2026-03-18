import { fetchAllSchools } from '../client.js';
import type { Env, ToolResult } from '../types.js';

const VALID_LEVELS = ['大專校院', '國民中學', '高級中等學校'];

export async function searchSchools(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    const city = args.city as string | undefined;
    const level = args.level as string | undefined;

    if (!keyword && !city && !level) {
      return {
        content: [{ type: 'text', text: '請至少提供一個搜尋條件（關鍵字、縣市或學制）' }],
        isError: true,
      };
    }

    if (level && !VALID_LEVELS.some((v) => level.includes(v) || v.includes(level))) {
      return {
        content: [{
          type: 'text',
          text: `學制「${level}」不在支援範圍。支援的學制：${VALID_LEVELS.join('、')}`,
        }],
        isError: true,
      };
    }

    const records = await fetchAllSchools({ keyword, city, level });

    if (records.length === 0) {
      const conditions = [
        keyword ? `關鍵字「${keyword}」` : '',
        city ? `縣市「${city}」` : '',
        level ? `學制「${level}」` : '',
      ].filter(Boolean).join('、');
      return {
        content: [{ type: 'text', text: `查無符合條件的學校（${conditions}）` }],
      };
    }

    const limited = records.slice(0, 50);
    const lines = limited.map((r) =>
      `[${r.level}] ${r.name}（${r.publicPrivate}）— ${r.city}`
    );

    const header = `搜尋結果：共 ${records.length} 所學校${records.length > 50 ? '（顯示前 50 所）' : ''}`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `搜尋學校失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
