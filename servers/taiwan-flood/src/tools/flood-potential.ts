import { fetchWraDataset, WRA_DATASETS } from '../client.js';
import type { Env, ToolResult, FloodPotentialRecord } from '../types.js';

export async function getFloodPotential(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;
    const town = args.town as string | undefined;

    const params: Record<string, string> = {};
    if (county) params.County = county;
    if (town) params.Town = town;

    const records = await fetchWraDataset<FloodPotentialRecord>(
      WRA_DATASETS.FLOOD_POTENTIAL,
      Object.keys(params).length > 0 ? params : undefined
    );

    if (records.length === 0) {
      return {
        content: [{ type: 'text', text: county ? `找不到 ${county} 的淹水潛勢資料` : '無淹水潛勢資料' }],
      };
    }

    const lines = records.slice(0, 20).map((r) =>
      [
        `${r.County} ${r.Town} ${r.Village ?? ''}`.trim(),
        `  重現期距: ${r.ReturnPeriod}`,
        `  淹水深度: ${r.FloodDepth} m`,
        `  更新時間: ${r.UpdateTime}`,
      ].join('\n')
    );

    const header = `淹水潛勢資料（共 ${records.length} 筆，顯示前 ${Math.min(records.length, 20)} 筆）`;
    return { content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得淹水潛勢資料失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
