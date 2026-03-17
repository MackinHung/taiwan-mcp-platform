import { fetchEndpoint } from '../client.js';
import type { Env, ToolResult, ThsrTimetable } from '../types.js';

function formatDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function searchThsrTimetable(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const origin = args.origin as string | undefined;
    const destination = args.destination as string | undefined;

    if (!origin || !destination) {
      return {
        content: [{ type: 'text', text: '請提供起站代碼 (origin) 和迄站代碼 (destination)' }],
        isError: true,
      };
    }

    const date = (args.date as string) || formatDate();
    const endpoint = `/Rail/THSR/DailyTimetable/OD/${origin}/to/${destination}/${date}`;
    const data = await fetchEndpoint<ThsrTimetable[]>(env, endpoint, { '$top': '20' });

    if (!data || data.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到 ${date} 從 ${origin} 到 ${destination} 的高鐵班次` }],
      };
    }

    const lines = data.map((train) => {
      const info = train.DailyTrainInfo;
      const originStop = train.StopTimes.find((s) => s.StationID === origin);
      const destStop = train.StopTimes.find((s) => s.StationID === destination);
      return [
        `車次: ${info.TrainNo}`,
        `  起站: ${info.StartingStationName.Zh_tw} → 迄站: ${info.EndingStationName.Zh_tw}`,
        `  出發: ${originStop?.DepartureTime ?? '未知'} → 抵達: ${destStop?.ArrivalTime ?? '未知'}`,
      ].join('\n');
    });

    const header = `高鐵時刻表 ${date}（${origin} → ${destination}）共 ${data.length} 班次\n`;
    return { content: [{ type: 'text', text: header + lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢高鐵時刻表失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
