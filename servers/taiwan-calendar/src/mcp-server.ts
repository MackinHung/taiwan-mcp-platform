import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { getHolidays } from './tools/holidays.js';
import { isBusinessDay } from './tools/business-day.js';
import { convertToLunar } from './tools/lunar-convert.js';
import { convertToSolar } from './tools/solar-convert.js';
import { countBusinessDays } from './tools/count-days.js';

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
    'get_holidays',
    '查詢指定年度國定假日',
    {
      year: z.number().describe('年度（西元），如 2026'),
    },
    async ({ year }) =>
      toMcpResult(await getHolidays(env, { year }))
  );

  server.tool(
    'is_business_day',
    '判斷指定日期是否為工作日',
    {
      date: z.string().describe('日期，YYYY-MM-DD 格式'),
    },
    async ({ date }) =>
      toMcpResult(await isBusinessDay(env, { date }))
  );

  server.tool(
    'convert_to_lunar',
    '國曆轉農曆（含生肖、天干地支）',
    {
      date: z.string().describe('國曆日期，YYYY-MM-DD 格式'),
    },
    async ({ date }) =>
      toMcpResult(await convertToLunar(env, { date }))
  );

  server.tool(
    'convert_to_solar',
    '農曆轉國曆',
    {
      lunarYear: z.number().describe('農曆年（西元）'),
      lunarMonth: z.number().describe('農曆月（1-12）'),
      lunarDay: z.number().describe('農曆日'),
      isLeapMonth: z.boolean().optional().describe('是否為閏月（預設 false）'),
    },
    async ({ lunarYear, lunarMonth, lunarDay, isLeapMonth }) =>
      toMcpResult(await convertToSolar(env, { lunarYear, lunarMonth, lunarDay, isLeapMonth }))
  );

  server.tool(
    'count_business_days',
    '計算兩日期間工作天數',
    {
      startDate: z.string().describe('起始日期，YYYY-MM-DD 格式'),
      endDate: z.string().describe('結束日期，YYYY-MM-DD 格式'),
    },
    async ({ startDate, endDate }) =>
      toMcpResult(await countBusinessDays(env, { startDate, endDate }))
  );

  return server;
}
