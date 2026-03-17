import { fetchEndpoint } from '../client.js';
import type { Env, ToolResult, MetroRoute } from '../types.js';

const VALID_OPERATORS = ['TRTC', 'KRTC', 'TYMC'] as const;

function getOperatorName(operator: string): string {
  const names: Record<string, string> = {
    TRTC: '台北捷運',
    KRTC: '高雄捷運',
    TYMC: '桃園捷運',
  };
  return names[operator] ?? operator;
}

export async function getMetroInfo(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const operator = (args.operator as string) || 'TRTC';
    const line = args.line as string | undefined;

    if (!VALID_OPERATORS.includes(operator as typeof VALID_OPERATORS[number])) {
      return {
        content: [{
          type: 'text',
          text: `無效的營運商代碼: ${operator}，可用選項: ${VALID_OPERATORS.join(', ')}`,
        }],
        isError: true,
      };
    }

    const endpoint = `/Rail/Metro/StationOfRoute/${operator}`;
    const data = await fetchEndpoint<MetroRoute[]>(env, endpoint);

    if (!data || data.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到 ${getOperatorName(operator)} 的路線資訊` }],
      };
    }

    const filtered = line
      ? data.filter((r) => r.LineID === line || r.RouteName.Zh_tw.includes(line))
      : data;

    if (filtered.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到路線 ${line} 的站點資訊` }],
      };
    }

    const lines = filtered.map((route) => {
      const stations = route.Stations
        ? route.Stations
            .sort((a, b) => a.Sequence - b.Sequence)
            .map((s) => `  ${s.Sequence}. ${s.StationName.Zh_tw} (${s.StationID})`)
            .join('\n')
        : '  無站點資料';
      return `路線: ${route.RouteName.Zh_tw} (${route.LineID})\n${stations}`;
    });

    const header = `${getOperatorName(operator)} 路線站點資訊\n`;
    return { content: [{ type: 'text', text: header + lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得捷運資訊失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
