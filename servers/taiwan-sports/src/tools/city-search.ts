import { searchByCity } from '../client.js';
import type { Env, ToolResult, FacilityRecord } from '../types.js';

export async function searchByCityTool(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;

    if (!city || typeof city !== 'string' || city.trim() === '') {
      return {
        content: [{ type: 'text', text: '請提供縣市名稱（city），例如：臺北市、高雄市' }],
        isError: true,
      };
    }

    const results = searchByCity(city.trim());

    if (results.length === 0) {
      return {
        content: [{ type: 'text', text: `查無「${city}」的運動場館，請確認縣市名稱是否正確` }],
      };
    }

    return {
      content: [{ type: 'text', text: formatCityResults(city, results) }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `搜尋縣市場館失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

function formatCityResults(city: string, facilities: FacilityRecord[]): string {
  // Group by sport type
  const sportMap = new Map<string, number>();
  for (const f of facilities) {
    for (const sport of f.sportTypes) {
      sportMap.set(sport, (sportMap.get(sport) ?? 0) + 1);
    }
  }

  const sportSummary = Array.from(sportMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([sport, count]) => `${sport}(${count})`)
    .join('、');

  const header = `${city}運動場館：共 ${facilities.length} 間\n運動項目統計：${sportSummary}`;

  const lines = facilities.map((f) =>
    `- ${f.name}（${f.district}）\n  地址：${f.address}\n  運動項目：${f.sportTypes.join('、')}\n  開放時間：${f.openHours}`
  );

  return `${header}\n\n${lines.join('\n\n')}`;
}
