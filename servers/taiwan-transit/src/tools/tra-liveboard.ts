import { fetchEndpoint } from '../client.js';
import type { Env, ToolResult, TrainLiveBoard } from '../types.js';

function formatDelayStatus(delayTime: number): string {
  if (delayTime === 0) return '準點';
  return `誤點 ${delayTime} 分鐘`;
}

function formatDirection(direction: number): string {
  return direction === 0 ? '順行' : '逆行';
}

export async function getTraLiveboard(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const stationId = args.stationId as string | undefined;
    const endpoint = stationId
      ? `/Rail/TRA/LiveBoard/Station/${stationId}`
      : '/Rail/TRA/LiveBoard';
    const data = await fetchEndpoint<TrainLiveBoard[]>(env, endpoint, { '$top': '30' });

    if (!data || data.length === 0) {
      return {
        content: [{
          type: 'text',
          text: stationId
            ? `找不到車站 ${stationId} 的即時資訊`
            : '無即時到離站資訊',
        }],
      };
    }

    const lines = data.map((entry) => {
      const parts = [
        `車站: ${entry.StationName.Zh_tw}`,
        `  車次: ${entry.TrainNo} (${entry.TrainTypeName.Zh_tw})`,
        `  方向: ${formatDirection(entry.Direction)} → ${entry.EndingStationName.Zh_tw}`,
      ];
      if (entry.ScheduledArrivalTime) {
        parts.push(`  預定到達: ${entry.ScheduledArrivalTime}`);
      }
      if (entry.ScheduledDepartureTime) {
        parts.push(`  預定出發: ${entry.ScheduledDepartureTime}`);
      }
      parts.push(`  狀態: ${formatDelayStatus(entry.DelayTime)}`);
      return parts.join('\n');
    });

    const title = stationId ? `車站 ${stationId} 即時到離站` : '台鐵即時到離站';
    const header = `${title}（共 ${data.length} 筆）\n`;
    return { content: [{ type: 'text', text: header + lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得台鐵即時資訊失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
