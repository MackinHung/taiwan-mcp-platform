import { fetchRadiationData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getStationHistory(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const stationName = args.stationName as string | undefined;
    if (!stationName || stationName.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供監測站名稱' }],
        isError: true,
      };
    }

    const trimmed = stationName.trim();
    const { records } = await fetchRadiationData({ limit: 1000 });

    const matched = records.filter((r) => r.stationName.includes(trimmed));

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無監測站「${trimmed}」的資料` },
        ],
      };
    }

    const lines = matched.map((r) =>
      [
        `監測站: ${r.stationName}`,
        `  監測值: ${r.value} μSv/h`,
        `  測量時間: ${r.measureTime}`,
        `  所在縣市: ${r.county} ${r.district}`,
        `  地址: ${r.address}`,
        `  狀態: ${r.status}`,
      ].join('\n')
    );

    const header = `監測站「${trimmed}」歷史資料（共 ${matched.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得監測站歷史資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
