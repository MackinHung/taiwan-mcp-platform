import { fetchReservoirData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getReservoirDetails(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const name = args.name as string | undefined;
    if (!name || name.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供水庫名稱' }],
        isError: true,
      };
    }

    const trimmedName = name.trim();
    const { records } = await fetchReservoirData({ limit: 200 });

    const matched = records.filter(
      (r) => r.ReservoirName && r.ReservoirName.includes(trimmedName)
    );

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無「${trimmedName}」水庫詳細資訊` },
        ],
      };
    }

    const lines = matched.map((r) => {
      return [
        `=== ${r.ReservoirName || '未知'} ===`,
        `蓄水量: ${r.CurrentCapacity || '未知'} 萬立方公尺`,
        `蓄水百分比: ${r.CurrentCapacityPercent || '未知'}%`,
        `有效容量: ${r.EffectiveCapacity || '未知'} 萬立方公尺`,
        `進水量: ${r.WaterInflow || '未知'}`,
        `出水量: ${r.WaterOutflow || '未知'}`,
        `供水量: ${r.WaterSupply || '未知'}`,
        `集水區雨量: ${r.CatchmentAreaRainfall || '未知'} mm`,
        `更新時間: ${r.UpdateTime || '未知'}`,
      ].join('\n');
    });

    const header = `「${trimmedName}」水庫詳細資訊（共 ${matched.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得水庫詳細資訊失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
