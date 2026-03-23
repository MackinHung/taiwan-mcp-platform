import type { Env, ToolResult, FisheryRecord } from '../types.js';
import { fetchFisheryData } from '../client.js';

function formatPort(r: FisheryRecord): string {
  return [
    `${r.portName}`,
    `  縣市: ${r.portCounty}`,
    `  地址: ${r.portAddress || '無資料'}`,
  ].join('\n');
}

export async function searchFishingPorts(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string;
    if (!keyword) {
      return {
        content: [{ type: 'text', text: '請提供搜尋關鍵字（keyword 參數）' }],
        isError: true,
      };
    }

    const limit = Math.min(Math.max((args.limit as number) || 20, 1), 100);
    const { records } = await fetchFisheryData({ limit: 1000 });

    const matched = records.filter(
      (r) =>
        r.portName &&
        (r.portName.includes(keyword) || r.portCounty.includes(keyword))
    );

    // Deduplicate by port name
    const seen = new Set<string>();
    const unique: FisheryRecord[] = [];
    for (const r of matched) {
      if (!seen.has(r.portName)) {
        seen.add(r.portName);
        unique.push(r);
      }
    }

    const limited = unique.slice(0, limit);

    if (limited.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到包含「${keyword}」的漁港資料` }],
      };
    }

    const lines = limited.map(formatPort);
    const header = `漁港搜尋結果 — 「${keyword}」（共 ${unique.length} 座，顯示 ${limited.length} 座）`;
    return { content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋漁港資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
