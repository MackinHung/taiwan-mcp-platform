import { fetchAccidents } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchByLocation(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;
    const district = args.district as string | undefined;

    if (!county || typeof county !== 'string' || county.trim() === '') {
      return {
        content: [{ type: 'text', text: '請提供縣市名稱（如：臺北市、新北市）' }],
        isError: true,
      };
    }

    const { records, total } = await fetchAccidents({ county: county.trim(), limit: 100 });

    // If district is specified, filter further
    const filtered = district
      ? records.filter((r) => r.district.includes(district.trim()))
      : records;

    if (filtered.length === 0) {
      const locationStr = district ? `${county}${district}` : county;
      return {
        content: [{ type: 'text', text: `查無${locationStr}的交通事故資料` }],
      };
    }

    const lines = filtered.map((r) => {
      const date = r.occurDate || '未知';
      const time = r.occurTime || '';
      const location = `${r.district} ${r.address}`.trim();
      const casualties = `死亡${r.deathCount}人 受傷${r.injuryCount}人`;
      const cause = r.cause || '';
      return `${date} ${time} | ${location} | ${casualties} | ${cause}`;
    });

    const locationStr = district ? `${county}${district}` : county;
    const header = `${locationStr}交通事故（${filtered.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `搜尋地區事故資料失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
