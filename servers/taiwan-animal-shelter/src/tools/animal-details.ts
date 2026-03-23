import { fetchAnimalData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getAnimalDetails(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const animalId = args.animalId as string | undefined;
    if (!animalId || animalId.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供動物流水編號' }],
        isError: true,
      };
    }

    const trimmedId = animalId.trim();
    const { records } = await fetchAnimalData({ limit: 500 });

    const animal = records.find((r) => r.animalId === trimmedId);

    if (!animal) {
      return {
        content: [
          { type: 'text', text: `查無編號「${trimmedId}」的動物資料` },
        ],
      };
    }

    const sexMap: Record<string, string> = { M: '公', F: '母', N: '未知' };
    const statusMap: Record<string, string> = {
      OPEN: '開放領養',
      ADOPTED: '已領養',
      DEAD: '死亡',
      OTHER: '其他',
    };

    const lines = [
      `=== 動物詳細資訊 ===`,
      `流水編號: ${animal.animalId}`,
      `區域編號: ${animal.areaId || '未知'}`,
      `種類: ${animal.species || '未知'}`,
      `品種: ${animal.breed || '未知'}`,
      `性別: ${sexMap[animal.sex] || animal.sex || '未知'}`,
      `體型: ${animal.bodySize || '未知'}`,
      `毛色: ${animal.color || '未知'}`,
      `年齡: ${animal.age || '未知'}`,
      `狀態: ${statusMap[animal.status] || animal.status || '未知'}`,
      `所在地: ${animal.location || '未知'}`,
      ``,
      `=== 收容所資訊 ===`,
      `名稱: ${animal.shelterName || '未知'}`,
      `地址: ${animal.shelterAddress || '未知'}`,
      `電話: ${animal.shelterPhone || '未知'}`,
      ``,
      `資料更新時間: ${animal.updateTime || '未知'}`,
      animal.imageUrl ? `照片: ${animal.imageUrl}` : '照片: 無',
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得動物詳細資訊失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
