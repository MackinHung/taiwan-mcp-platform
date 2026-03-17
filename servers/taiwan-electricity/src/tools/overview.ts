import type { Env, ToolResult } from '../types.js';
import { fetchPowerOverview } from '../client.js';

export async function getPowerOverview(
  _env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const data = await fetchPowerOverview();

    const reserveStatus =
      data.reserveRate >= 10
        ? '充裕（綠燈）'
        : data.reserveRate >= 6
          ? '吃緊（黃燈）'
          : '警戒（紅燈）';

    const lines = [
      `台灣即時電力供需概況`,
      `更新時間: ${data.updateTime}`,
      '',
      '--- 即時 ---',
      `目前用電: ${data.currentLoad.toLocaleString()} MW`,
      `供電能力: ${data.supplyCapacity.toLocaleString()} MW`,
      `最大供電: ${data.peakCapacity.toLocaleString()} MW`,
      `備轉容量: ${(data.supplyCapacity - data.currentLoad).toLocaleString()} MW`,
      `備轉容量率: ${data.reserveRate}% ${reserveStatus}`,
      '',
      '--- 昨日 ---',
      `尖峰用電: ${data.yesterdayPeakLoad.toLocaleString()} MW`,
      `供電能力: ${data.yesterdaySupply.toLocaleString()} MW`,
      `備轉容量率: ${data.yesterdayReserveRate}%`,
      `日期: ${data.yesterdayDate}`,
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得電力供需概況失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
