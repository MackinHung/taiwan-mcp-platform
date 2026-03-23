import { fetchAnimalData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getRecentIntakes(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = (args.limit as number) ?? 20;
    const { records } = await fetchAnimalData({ limit: 500 });

    if (!records || records.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無最新入所動物資料' }],
      };
    }

    const sorted = [...records].sort((a, b) => {
      const timeA = a.updateTime || '';
      const timeB = b.updateTime || '';
      return timeB.localeCompare(timeA);
    });

    const limited = sorted.slice(0, limit);

    const sexMap: Record<string, string> = { M: '公', F: '母', N: '未知' };
    const lines = limited.map((r) => {
      return [
        `編號: ${r.animalId}`,
        `  種類: ${r.species || '未知'} / 品種: ${r.breed || '未知'}`,
        `  性別: ${sexMap[r.sex] || r.sex || '未知'} / 體型: ${r.bodySize || '未知'}`,
        `  毛色: ${r.color || '未知'}`,
        `  收容所: ${r.shelterName || '未知'}`,
        `  入所時間: ${r.updateTime || '未知'}`,
        r.imageUrl ? `  照片: ${r.imageUrl}` : null,
      ].filter(Boolean).join('\n');
    });

    const header = `最新入所動物（顯示 ${limited.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得最新入所動物失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
