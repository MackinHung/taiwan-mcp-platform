import { fetchEndpoint } from '../client.js';
import type { Env, ToolResult, BusEstimate } from '../types.js';

const STOP_STATUS_MAP: Record<number, string> = {
  0: '正常',
  1: '尚未發車',
  2: '交管不停靠',
  3: '末班已過',
  4: '今日未營運',
};

function formatEstimateTime(seconds: number | undefined): string {
  if (seconds === undefined || seconds < 0) return '未知';
  if (seconds === 0) return '進站中';
  const minutes = Math.ceil(seconds / 60);
  return `約 ${minutes} 分鐘`;
}

function formatDirection(direction: number): string {
  return direction === 0 ? '去程' : '返程';
}

export async function getBusArrival(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as string | undefined;
    const routeName = args.routeName as string | undefined;

    if (!city || !routeName) {
      return {
        content: [{ type: 'text', text: '請提供城市 (city) 和路線名稱 (routeName)' }],
        isError: true,
      };
    }

    const endpoint = `/Bus/EstimatedTimeOfArrival/City/${city}/${routeName}`;
    const data = await fetchEndpoint<BusEstimate[]>(env, endpoint, { '$top': '50' });

    if (!data || data.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到 ${city} ${routeName} 路線的到站資訊` }],
      };
    }

    const lines = data.map((stop) => {
      const status = STOP_STATUS_MAP[stop.StopStatus] ?? '未知狀態';
      const estimate = stop.StopStatus === 0
        ? formatEstimateTime(stop.EstimateTime)
        : status;
      return `  ${stop.StopName.Zh_tw} [${formatDirection(stop.Direction)}] — ${estimate}`;
    });

    const header = `${city} ${routeName} 公車到站時間（共 ${data.length} 站）\n`;
    return { content: [{ type: 'text', text: header + lines.join('\n') }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得公車到站資訊失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
