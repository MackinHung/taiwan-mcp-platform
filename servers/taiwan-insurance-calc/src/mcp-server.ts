import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { Env, ToolResult } from './types.js';
import { calculateLaborInsurance } from './tools/labor-insurance.js';
import { calculateHealthInsurance } from './tools/health-insurance.js';
import { calculatePension } from './tools/pension.js';
import { calculateEmployerCost } from './tools/employer-cost.js';
import { getSalaryGrade } from './tools/salary-grade.js';

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
    'calculate_labor_insurance',
    '勞保費試算 — 根據月薪計算勞保各方負擔',
    {
      salary: z.number().describe('月薪（必填）'),
    },
    async ({ salary }) =>
      toMcpResult(await calculateLaborInsurance(env, { salary }))
  );

  server.tool(
    'calculate_health_insurance',
    '健保費試算 — 根據月薪與眷屬人數計算健保各方負擔',
    {
      salary: z.number().describe('月薪（必填）'),
      dependents: z.number().optional().describe('眷屬人數（預設 0，最多計 3 人）'),
    },
    async ({ salary, dependents }) =>
      toMcpResult(await calculateHealthInsurance(env, { salary, dependents }))
  );

  server.tool(
    'calculate_pension',
    '勞退提繳試算 — 計算雇主與勞工自願提繳金額',
    {
      salary: z.number().describe('月薪（必填）'),
      voluntaryRate: z.number().optional().describe('勞工自願提繳比例 0-6%（預設 0）'),
    },
    async ({ salary, voluntaryRate }) =>
      toMcpResult(await calculatePension(env, { salary, voluntaryRate }))
  );

  server.tool(
    'calculate_employer_cost',
    '雇主總人事成本試算 — 計算勞保、健保、勞退、就保、職災的雇主負擔',
    {
      salary: z.number().describe('月薪（必填）'),
    },
    async ({ salary }) =>
      toMcpResult(await calculateEmployerCost(env, { salary }))
  );

  server.tool(
    'get_salary_grade',
    '查詢投保薪資級距 — 根據月薪找到對應的投保薪資級距',
    {
      salary: z.number().describe('月薪（必填）'),
    },
    async ({ salary }) =>
      toMcpResult(await getSalaryGrade(env, { salary }))
  );

  return server;
}
