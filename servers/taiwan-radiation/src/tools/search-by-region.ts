import { fetchRadiationData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchByRegion(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const region = args.region as string | undefined;
    if (!region || region.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供縣市或地區關鍵字' }],
        isError: true,
      };
    }

    const trimmed = region.trim();
    const { records } = await fetchRadiationData({ limit: 1000 });

    const matched = records.filter(
      (r) => r.county.includes(trimmed) || r.district.includes(trimmed)
    );

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無「${trimmed}」地區的輻射監測站` },
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

    const header = `地區搜尋「${trimmed}」（共 ${matched.length} 站）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋地區輻射資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
