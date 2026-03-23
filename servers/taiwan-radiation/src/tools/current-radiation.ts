import { fetchRadiationData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getCurrentRadiation(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = (args.limit as number) ?? 20;

    const { records, total } = await fetchRadiationData({ limit });

    if (records.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無輻射監測資料' }],
      };
    }

    const lines = records.map((r) =>
      [
        `監測站: ${r.stationName}`,
        `  監測值: ${r.value} μSv/h`,
        `  測量時間: ${r.measureTime}`,
        `  所在縣市: ${r.county}`,
        `  狀態: ${r.status}`,
      ].join('\n')
    );

    const header = `全台即時輻射監測（共 ${total} 站，顯示 ${records.length} 站）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得即時輻射監測資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
