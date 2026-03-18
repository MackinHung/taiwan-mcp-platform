import { fetchAllSchools } from '../client.js';
import type { Env, ToolResult, SchoolRecord } from '../types.js';

export async function searchByLocation(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;
    const district = args.district as string | undefined;

    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供縣市名稱' }],
        isError: true,
      };
    }

    const trimmedCity = city.trim();
    const records = await fetchAllSchools({ city: trimmedCity });

    if (records.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `查無「${trimmedCity}」的學校資料，請確認縣市名稱是否正確（例如：臺北市、新北市、臺中市）`,
        }],
      };
    }

    // Filter by district if provided (check address contains district)
    let filtered: SchoolRecord[];
    if (district && district.trim().length > 0) {
      const trimmedDistrict = district.trim();
      filtered = records.filter((r) => r.address.includes(trimmedDistrict));
      if (filtered.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `在「${trimmedCity}」中查無「${trimmedDistrict}」的學校資料`,
          }],
        };
      }
    } else {
      filtered = records;
    }

    // Group by level
    const grouped: Record<string, SchoolRecord[]> = {};
    for (const r of filtered) {
      const level = r.level;
      if (!grouped[level]) {
        grouped[level] = [];
      }
      grouped[level].push(r);
    }

    const sections = Object.entries(grouped).map(([level, schools]) => {
      const limited = schools.slice(0, 20);
      const lines = limited.map((r) => `  ${r.name}（${r.publicPrivate}）`);
      const overflow = schools.length > 20 ? `  ...及其他 ${schools.length - 20} 所` : '';
      return `【${level}】共 ${schools.length} 所\n${lines.join('\n')}${overflow ? '\n' + overflow : ''}`;
    });

    const locationLabel = district ? `${trimmedCity}${district}` : trimmedCity;
    const header = `${locationLabel} 學校列表（共 ${filtered.length} 所）`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${sections.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `依區域搜尋學校失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
