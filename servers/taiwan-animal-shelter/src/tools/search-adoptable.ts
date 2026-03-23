import { fetchAnimalData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchAdoptableAnimals(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const species = args.species as string | undefined;
    const breed = args.breed as string | undefined;
    const bodySize = args.bodySize as string | undefined;
    const limit = (args.limit as number) ?? 20;

    const { records, total } = await fetchAnimalData({
      status: 'OPEN',
      species: species?.trim() || undefined,
      limit: 500,
    });

    let filtered = records;
    if (breed && breed.trim()) {
      const keyword = breed.trim();
      filtered = filtered.filter((r) => r.breed.includes(keyword));
    }
    if (bodySize && bodySize.trim()) {
      const size = bodySize.trim().toUpperCase();
      filtered = filtered.filter((r) => r.bodySize === size);
    }

    const limited = filtered.slice(0, limit);

    if (limited.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無符合條件的可領養動物' }],
      };
    }

    const sexMap: Record<string, string> = { M: '公', F: '母', N: '未知' };
    const lines = limited.map((r) => {
      return [
        `編號: ${r.animalId}`,
        `  種類: ${r.species || '未知'} / 品種: ${r.breed || '未知'}`,
        `  性別: ${sexMap[r.sex] || r.sex || '未知'} / 體型: ${r.bodySize || '未知'}`,
        `  毛色: ${r.color || '未知'} / 年齡: ${r.age || '未知'}`,
        `  收容所: ${r.shelterName || '未知'}`,
        `  所在地: ${r.location || '未知'}`,
        r.imageUrl ? `  照片: ${r.imageUrl}` : null,
      ].filter(Boolean).join('\n');
    });

    const header = `可領養動物（符合 ${filtered.length} 筆，顯示 ${limited.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `搜尋可領養動物失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
