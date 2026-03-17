import type { Env, ToolResult, JsonRpcRequest, JsonRpcResponse } from './types.js';
import { getAqi, getStationDetail } from './tools/aqi.js';
import { getPm25Ranking } from './tools/ranking.js';
import { getUnhealthyStations, getCountySummary } from './tools/alert.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'get_aqi',
    description: '取得台灣各測站即時空氣品質指標（AQI），可按縣市或測站名稱篩選',
    inputSchema: {
      type: 'object' as const,
      properties: {
        county: {
          type: 'string',
          description: '縣市名稱，例如「臺北市」「高雄市」（不填=全部測站）',
        },
        station: {
          type: 'string',
          description: '測站名稱，例如「松山」「左營」（不填=全部測站）',
        },
      },
    },
  },
  {
    name: 'get_station_detail',
    description: '取得特定測站的完整污染物數據（PM2.5、PM10、O3、CO、SO2、NO2 等）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        station: {
          type: 'string',
          description: '測站名稱（必填），例如「松山」「中山」',
        },
      },
      required: ['station'],
    },
  },
  {
    name: 'get_unhealthy_stations',
    description: '取得 AQI 超過指定門檻的測站清單（預設門檻 100）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        threshold: {
          type: 'number',
          description: 'AQI 門檻值（預設 100，超過此值列為不健康）',
        },
      },
    },
  },
  {
    name: 'get_pm25_ranking',
    description: '取得全台測站 PM2.5 濃度排名（由高到低）',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: {
          type: 'number',
          description: '顯示前 N 名（預設 10，最多 100）',
        },
      },
    },
  },
  {
    name: 'get_county_summary',
    description: '取得各縣市空氣品質摘要（平均/最高/最低 AQI）',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  get_aqi: getAqi,
  get_station_detail: getStationDetail,
  get_unhealthy_stations: getUnhealthyStations,
  get_pm25_ranking: getPm25Ranking,
  get_county_summary: getCountySummary,
};

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
          error: { code: -32601, message: `Tool not found: ${toolName}` },
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
