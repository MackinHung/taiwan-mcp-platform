import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { queryLiquefactionPotential } from './tools/liquefaction.js';
import { getActiveFaultsNearby } from './tools/faults.js';
import { querySensitiveAreas } from './tools/sensitive-areas.js';
import { getLandslideAlerts } from './tools/landslide.js';
import { getGeologicalInfo } from './tools/geological-info.js';

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
    'query_liquefaction_potential',
    '查詢指定座標的土壤液化潛勢等級（高/中/低）',
    {
      latitude: z.number().describe('緯度（WGS84）'),
      longitude: z.number().describe('經度（WGS84）'),
    },
    async ({ latitude, longitude }) =>
      toMcpResult(await queryLiquefactionPotential(env, { latitude, longitude }))
  );

  server.tool(
    'get_active_faults_nearby',
    '查詢座標附近活動斷層（名稱、距離、類型）',
    {
      latitude: z.number().describe('緯度（WGS84）'),
      longitude: z.number().describe('經度（WGS84）'),
      radius_km: z.number().optional().describe('搜尋半徑公里（預設 50）'),
    },
    async ({ latitude, longitude, radius_km }) =>
      toMcpResult(await getActiveFaultsNearby(env, { latitude, longitude, radius_km }))
  );

  server.tool(
    'query_sensitive_areas',
    '查詢座標附近地質敏感區（斷層/山崩/地滑）',
    {
      latitude: z.number().describe('緯度（WGS84）'),
      longitude: z.number().describe('經度（WGS84）'),
      radius_km: z.number().optional().describe('搜尋半徑公里（預設 5）'),
    },
    async ({ latitude, longitude, radius_km }) =>
      toMcpResult(await querySensitiveAreas(env, { latitude, longitude, radius_km }))
  );

  server.tool(
    'get_landslide_alerts',
    '取得目前大規模崩塌警戒（紅/黃色）',
    {
      county: z.string().optional().describe('縣市名稱（不填=全部）'),
      alert_level: z.string().optional().describe('警戒等級: red/yellow/all（預設 all）'),
    },
    async ({ county, alert_level }) =>
      toMcpResult(await getLandslideAlerts(env, { county, alert_level }))
  );

  server.tool(
    'get_geological_info',
    '取得指定座標地質圖資訊（地層/年代/岩性）',
    {
      latitude: z.number().describe('緯度（WGS84）'),
      longitude: z.number().describe('經度（WGS84）'),
    },
    async ({ latitude, longitude }) =>
      toMcpResult(await getGeologicalInfo(env, { latitude, longitude }))
  );

  return server;
}
