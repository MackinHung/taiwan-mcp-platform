import { searchFacilities } from '../client.js';
import type { Env, ToolResult, FacilityRecord } from '../types.js';

export async function searchFacilitiesTool(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const sportType = args.sportType as string | undefined;
    const city = args.city as string | undefined;
    const keyword = args.keyword as string | undefined;

    if (!sportType && !city && !keyword) {
      return {
        content: [{ type: 'text', text: '請至少提供一個搜尋條件：sportType（運動類型）、city（縣市）或 keyword（關鍵字）' }],
        isError: true,
      };
    }

    const results = searchFacilities({ sportType, city, keyword });

    if (results.length === 0) {
      const conditions: string[] = [];
      if (sportType) conditions.push(`運動類型「${sportType}」`);
      if (city) conditions.push(`縣市「${city}」`);
      if (keyword) conditions.push(`關鍵字「${keyword}」`);
      return {
        content: [{ type: 'text', text: `查無符合條件的場館（${conditions.join('、')}）` }],
      };
    }

    return {
      content: [{ type: 'text', text: formatFacilityList(results, sportType, city, keyword) }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `搜尋場館失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

function formatFacilityList(
  facilities: FacilityRecord[],
  sportType?: string,
  city?: string,
  keyword?: string
): string {
  const conditions: string[] = [];
  if (sportType) conditions.push(`運動類型「${sportType}」`);
  if (city) conditions.push(`縣市「${city}」`);
  if (keyword) conditions.push(`關鍵字「${keyword}」`);

  const header = `搜尋結果（${conditions.join('、')}）：共 ${facilities.length} 間場館`;
  const lines = facilities.map((f) =>
    `- ${f.name}（${f.city}${f.district}）\n  地址：${f.address}\n  運動項目：${f.sportTypes.join('、')}\n  開放時間：${f.openHours}\n  費用：${f.fee}`
  );

  return `${header}\n\n${lines.join('\n\n')}`;
}
