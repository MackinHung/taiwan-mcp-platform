import { findFacilityByName } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getFacilityDetails(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const name = args.name as string | undefined;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return {
        content: [{ type: 'text', text: '請提供場館名稱（name）' }],
        isError: true,
      };
    }

    const facility = findFacilityByName(name.trim());

    if (!facility) {
      return {
        content: [{ type: 'text', text: `查無名稱包含「${name}」的場館` }],
      };
    }

    const detail = JSON.stringify({
      名稱: facility.name,
      地址: facility.address,
      電話: facility.phone,
      縣市: facility.city,
      區域: facility.district,
      運動項目: facility.sportTypes,
      開放時間: facility.openHours,
      費用: facility.fee,
      設施: facility.facilities,
      座標: { 緯度: facility.lat, 經度: facility.lng },
    }, null, 2);

    return {
      content: [{ type: 'text', text: detail }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得場館詳情失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
