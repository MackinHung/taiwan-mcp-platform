import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { searchTraTimetable } from './tools/tra-timetable.js';
import { searchThsrTimetable } from './tools/thsr-timetable.js';
import { getTraLiveboard } from './tools/tra-liveboard.js';
import { getMetroInfo } from './tools/metro.js';
import { getBusArrival } from './tools/bus-arrival.js';

function toMcpResult(result: ToolResult) {
  return {
    content: result.content,
    isError: result.isError,
  };
}

export function createMcpServer(env: Env): McpServer {
  const server = new McpServer({
    name: env.SERVER_NAME,
    version: env.SERVER_VERSION,
  });

  server.tool(
    'search_tra_timetable',
    '查詢台鐵時刻表（依起訖站與日期）',
    {
      origin: z.string().describe('起站代碼（如 1000=台北, 1001=松山, 3300=新竹, 4220=臺中, 5910=高雄）'),
      destination: z.string().describe('迄站代碼'),
      date: z.string().optional().describe('查詢日期 YYYY-MM-DD（不填=今天）'),
    },
    async ({ origin, destination, date }) =>
      toMcpResult(await searchTraTimetable(env, { origin, destination, date }))
  );

  server.tool(
    'search_thsr_timetable',
    '查詢高鐵時刻表（依起訖站與日期）',
    {
      origin: z.string().describe('起站代碼（0990=南港, 1000=台北, 1035=板橋, 1040=桃園, 1043=新竹, 1047=苗栗, 1050=台中, 1060=彰化, 1070=雲林, 1080=嘉義, 1090=台南, 1100=左營）'),
      destination: z.string().describe('迄站代碼'),
      date: z.string().optional().describe('查詢日期 YYYY-MM-DD（不填=今天）'),
    },
    async ({ origin, destination, date }) =>
      toMcpResult(await searchThsrTimetable(env, { origin, destination, date }))
  );

  server.tool(
    'get_tra_liveboard',
    '取得台鐵即時到離站資訊',
    {
      stationId: z.string().optional().describe('車站代碼（不填=全部車站，如 1000=台北）'),
    },
    async ({ stationId }) =>
      toMcpResult(await getTraLiveboard(env, { stationId }))
  );

  server.tool(
    'get_metro_info',
    '取得捷運路線與站點資訊',
    {
      operator: z.string().optional().describe('營運商代碼（TRTC=台北捷運, KRTC=高雄捷運, TYMC=桃園捷運，預設 TRTC）'),
      line: z.string().optional().describe('路線代碼或名稱（不填=全部路線）'),
    },
    async ({ operator, line }) =>
      toMcpResult(await getMetroInfo(env, { operator, line }))
  );

  server.tool(
    'get_bus_arrival',
    '取得公車即時到站時間',
    {
      city: z.string().describe('城市名稱（Taipei, NewTaipei, Taoyuan, Taichung, Tainan, Kaohsiung）'),
      routeName: z.string().describe('公車路線名稱（如 307, 紅5）'),
    },
    async ({ city, routeName }) =>
      toMcpResult(await getBusArrival(env, { city, routeName }))
  );

  return server;
}
