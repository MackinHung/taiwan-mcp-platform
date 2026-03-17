import type { Env, ToolResult } from './types.js';
import { searchTraTimetable } from './tools/tra-timetable.js';
import { searchThsrTimetable } from './tools/thsr-timetable.js';
import { getTraLiveboard } from './tools/tra-liveboard.js';
import { getMetroInfo } from './tools/metro.js';
import { getBusArrival } from './tools/bus-arrival.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'search_tra_timetable',
    description: '查詢台鐵時刻表（依起訖站與日期）',
    inputSchema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: '起站代碼（如 1000=台北, 1001=松山, 3300=新竹, 4220=臺中, 5910=高雄）',
        },
        destination: {
          type: 'string',
          description: '迄站代碼',
        },
        date: {
          type: 'string',
          description: '查詢日期 YYYY-MM-DD（不填=今天）',
        },
      },
      required: ['origin', 'destination'],
    },
  },
  {
    name: 'search_thsr_timetable',
    description: '查詢高鐵時刻表（依起訖站與日期）',
    inputSchema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: '起站代碼（0990=南港, 1000=台北, 1035=板橋, 1040=桃園, 1043=新竹, 1047=苗栗, 1050=台中, 1060=彰化, 1070=雲林, 1080=嘉義, 1090=台南, 1100=左營）',
        },
        destination: {
          type: 'string',
          description: '迄站代碼',
        },
        date: {
          type: 'string',
          description: '查詢日期 YYYY-MM-DD（不填=今天）',
        },
      },
      required: ['origin', 'destination'],
    },
  },
  {
    name: 'get_tra_liveboard',
    description: '取得台鐵即時到離站資訊',
    inputSchema: {
      type: 'object',
      properties: {
        stationId: {
          type: 'string',
          description: '車站代碼（不填=全部車站，如 1000=台北）',
        },
      },
    },
  },
  {
    name: 'get_metro_info',
    description: '取得捷運路線與站點資訊',
    inputSchema: {
      type: 'object',
      properties: {
        operator: {
          type: 'string',
          description: '營運商代碼（TRTC=台北捷運, KRTC=高雄捷運, TYMC=桃園捷運，預設 TRTC）',
        },
        line: {
          type: 'string',
          description: '路線代碼或名稱（不填=全部路線）',
        },
      },
    },
  },
  {
    name: 'get_bus_arrival',
    description: '取得公車即時到站時間',
    inputSchema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市名稱（Taipei, NewTaipei, Taoyuan, Taichung, Tainan, Kaohsiung）',
        },
        routeName: {
          type: 'string',
          description: '公車路線名稱（如 307, 紅5）',
        },
      },
      required: ['city', 'routeName'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  search_tra_timetable: searchTraTimetable,
  search_thsr_timetable: searchThsrTimetable,
  get_tra_liveboard: getTraLiveboard,
  get_metro_info: getMetroInfo,
  get_bus_arrival: getBusArrival,
};

interface JsonRpcRequest {
  jsonrpc?: string;
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: string;
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string };
}

export async function handleRpcRequest(
  env: Env,
  request: JsonRpcRequest
): Promise<JsonRpcResponse> {
  const { jsonrpc, id, method, params } = request;

  if (jsonrpc !== '2.0' || !method) {
    return {
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code: -32600, message: 'Invalid Request' },
    };
  }

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: { name: env.SERVER_NAME, version: env.SERVER_VERSION },
          capabilities: { tools: {} },
        },
      };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        result: { tools: TOOL_DEFINITIONS },
      };

    case 'tools/call': {
      const toolName = params?.name as string;
      const handler = TOOL_HANDLERS[toolName];
      if (!handler) {
        return {
          jsonrpc: '2.0',
          id: id ?? null,
          error: {
            code: -32601,
            message: `Tool not found: ${toolName}`,
          },
        };
      }
      const result = await handler(
        env,
        (params?.arguments ?? {}) as Record<string, unknown>
      );
      return { jsonrpc: '2.0', id: id ?? null, result };
    }

    default:
      return {
        jsonrpc: '2.0',
        id: id ?? null,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}
