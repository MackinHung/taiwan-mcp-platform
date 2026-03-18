import { fetchReservoirData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getLowCapacityAlerts(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const threshold = (args.threshold as number) ?? 30;

    const { records } = await fetchReservoirData({ limit: 200 });

    const lowCapacity = records.filter((r) => {
      const percent = parseFloat(r.CurrentCapacityPercent ?? '');
      return !isNaN(percent) && percent < threshold;
    });

    if (lowCapacity.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `目前沒有蓄水率低於 ${threshold}% 的水庫`,
          },
        ],
      };
    }

    const sorted = [...lowCapacity].sort((a, b) => {
      const pA = parseFloat(a.CurrentCapacityPercent ?? '100');
      const pB = parseFloat(b.CurrentCapacityPercent ?? '100');
      return pA - pB;
    });

    const lines = sorted.map((r) => {
      return [
        `⚠ ${r.ReservoirName || '未知'}`,
        `  蓄水百分比: ${r.CurrentCapacityPercent || '未知'}%`,
        `  蓄水量: ${r.CurrentCapacity || '未知'} 萬立方公尺`,
        `  有效容量: ${r.EffectiveCapacity || '未知'} 萬立方公尺`,
        `  更新時間: ${r.UpdateTime || '未知'}`,
      ].join('\n');
    });

    const header = `蓄水率低於 ${threshold}% 的水庫（共 ${sorted.length} 座）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得低蓄水率警示失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
