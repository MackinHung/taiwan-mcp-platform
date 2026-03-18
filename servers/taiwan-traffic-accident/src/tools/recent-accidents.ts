import { fetchAccidents } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getRecentAccidents(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = args.limit as number | undefined;

    if (limit !== undefined && (typeof limit !== 'number' || limit < 1 || limit > 100)) {
      return {
        content: [{ type: 'text', text: '筆數須為 1-100 的整數' }],
        isError: true,
      };
    }

    const effectiveLimit = limit ?? 20;
    const { records, total } = await fetchAccidents({ limit: effectiveLimit });

    if (!records || records.length === 0) {
      return {
        content: [{ type: 'text', text: '查無近期交通事故資料' }],
      };
    }

    const lines = records.map((r) => {
      const date = r.occurDate || '未知';
      const time = r.occurTime || '';
      const location = `${r.county}${r.district} ${r.address}`.trim();
      const type = r.accidentType || '';
      const casualties = `死亡${r.deathCount}人 受傷${r.injuryCount}人`;
      const cause = r.cause || '';
      return `${date} ${time} | ${location} | ${type} | ${casualties} | ${cause}`;
    });

    const header = `近期交通事故（顯示 ${records.length} 筆，共 ${total} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得近期事故資料失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
