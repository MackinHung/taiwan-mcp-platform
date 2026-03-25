import { fetchWraDataset, WRA_DATASETS } from '../client.js';
import type { Env, ToolResult, ReservoirRecord } from '../types.js';

function getStorageStatus(percentage: number): string {
  if (percentage >= 80) return '充沛';
  if (percentage >= 50) return '正常';
  if (percentage >= 30) return '偏低';
  if (percentage >= 10) return '警戒';
  return '嚴重不足';
}

export async function getReservoirStatus(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const reservoirName = args.reservoir_name as string | undefined;

    const records = await fetchWraDataset<ReservoirRecord>(WRA_DATASETS.RESERVOIR);

    let filtered = records;
    if (reservoirName) {
      filtered = filtered.filter((r) => r.ReservoirName?.includes(reservoirName));
    }

    if (filtered.length === 0) {
      return {
        content: [{
          type: 'text',
          text: reservoirName ? `找不到 ${reservoirName} 的水庫資料` : '無水庫水情資料',
        }],
      };
    }

    const lines = filtered.map((r) => {
      const pct = parseFloat(r.PercentageOfStorage);
      const status = isNaN(pct) ? '未知' : getStorageStatus(pct);
      return [
        `${r.ReservoirName}`,
        `  有效容量: ${r.EffectiveCapacity} 萬立方公尺`,
        `  目前蓄水量: ${r.CurrentCapacity} 萬立方公尺`,
        `  蓄水百分比: ${r.PercentageOfStorage}%`,
        `  蓄水狀態: ${status}`,
        `  進水量: ${r.WaterInflow} cms`,
        `  出水量: ${r.WaterOutflow} cms`,
        `  觀測時間: ${r.RecordTime}`,
      ].join('\n');
    });

    const header = `水庫水情（共 ${filtered.length} 座）`;
    return { content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得水庫水情失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
