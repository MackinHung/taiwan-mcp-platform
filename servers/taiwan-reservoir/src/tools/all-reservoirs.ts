import { fetchReservoirData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getAllReservoirs(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = (args.limit as number) ?? 100;

    const { records, total } = await fetchReservoirData({ limit });

    if (!records || records.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無水庫水情資料' }],
      };
    }

    const lines = records.map((r) => {
      return [
        `水庫: ${r.ReservoirName || '未知'}`,
        `  蓄水量: ${r.CurrentCapacity || '未知'} 萬立方公尺`,
        `  蓄水百分比: ${r.CurrentCapacityPercent || '未知'}%`,
        `  有效容量: ${r.EffectiveCapacity || '未知'} 萬立方公尺`,
        `  更新時間: ${r.UpdateTime || '未知'}`,
      ].join('\n');
    });

    const header = `全台水庫即時水情（共 ${total} 座，顯示 ${records.length} 座）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得水庫水情失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
