import { fetchAnimalData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

interface ShelterInfo {
  name: string;
  address: string;
  phone: string;
  animalCount: number;
}

export async function searchShelters(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    if (!keyword || keyword.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供收容所名稱或地點關鍵字' }],
        isError: true,
      };
    }

    const trimmedKeyword = keyword.trim();
    const limit = (args.limit as number) ?? 20;
    const { records } = await fetchAnimalData({ limit: 500 });

    const matched = records.filter(
      (r) =>
        (r.shelterName && r.shelterName.includes(trimmedKeyword)) ||
        (r.shelterAddress && r.shelterAddress.includes(trimmedKeyword)) ||
        (r.location && r.location.includes(trimmedKeyword))
    );

    const shelterMap = new Map<string, ShelterInfo>();
    for (const r of matched) {
      const key = r.shelterName || '未知';
      const existing = shelterMap.get(key);
      if (existing) {
        shelterMap.set(key, { ...existing, animalCount: existing.animalCount + 1 });
      } else {
        shelterMap.set(key, {
          name: r.shelterName || '未知',
          address: r.shelterAddress || '未知',
          phone: r.shelterPhone || '未知',
          animalCount: 1,
        });
      }
    }

    const shelters = Array.from(shelterMap.values()).slice(0, limit);

    if (shelters.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無「${trimmedKeyword}」相關收容所` },
        ],
      };
    }

    const lines = shelters.map((s) => {
      return [
        `收容所: ${s.name}`,
        `  地址: ${s.address}`,
        `  電話: ${s.phone}`,
        `  收容動物數: ${s.animalCount}`,
      ].join('\n');
    });

    const header = `「${trimmedKeyword}」相關收容所（共 ${shelters.length} 間）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `搜尋收容所失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
