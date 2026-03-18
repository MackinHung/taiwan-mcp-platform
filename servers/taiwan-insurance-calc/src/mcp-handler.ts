import type { Env, ToolResult } from './types.js';
import { calculateLaborInsurance } from './tools/labor-insurance.js';
import { calculateHealthInsurance } from './tools/health-insurance.js';
import { calculatePension } from './tools/pension.js';
import { calculateEmployerCost } from './tools/employer-cost.js';
import { getSalaryGrade } from './tools/salary-grade.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'calculate_labor_insurance',
    description: '勞保費試算 — 根據月薪計算勞保各方負擔',
    inputSchema: {
      type: 'object',
      properties: {
        salary: { type: 'number', description: '月薪（必填）' },
      },
      required: ['salary'],
    },
  },
  {
    name: 'calculate_health_insurance',
    description: '健保費試算 — 根據月薪與眷屬人數計算健保各方負擔',
    inputSchema: {
      type: 'object',
      properties: {
        salary: { type: 'number', description: '月薪（必填）' },
        dependents: { type: 'number', description: '眷屬人數（預設 0，最多計 3 人）' },
      },
      required: ['salary'],
    },
  },
  {
    name: 'calculate_pension',
    description: '勞退提繳試算 — 計算雇主與勞工自願提繳金額',
    inputSchema: {
      type: 'object',
      properties: {
        salary: { type: 'number', description: '月薪（必填）' },
        voluntaryRate: { type: 'number', description: '勞工自願提繳比例 0-6%（預設 0）' },
      },
      required: ['salary'],
    },
  },
  {
    name: 'calculate_employer_cost',
    description: '雇主總人事成本試算 — 計算勞保、健保、勞退、就保、職災的雇主負擔',
    inputSchema: {
      type: 'object',
      properties: {
        salary: { type: 'number', description: '月薪（必填）' },
      },
      required: ['salary'],
    },
  },
  {
    name: 'get_salary_grade',
    description: '查詢投保薪資級距 — 根據月薪找到對應的投保薪資級距',
    inputSchema: {
      type: 'object',
      properties: {
        salary: { type: 'number', description: '月薪（必填）' },
      },
      required: ['salary'],
    },
  },
];

const TOOL_HANDLERS: Record<
  string,
  (env: Env, args: Record<string, unknown>) => Promise<ToolResult>
> = {
  calculate_labor_insurance: calculateLaborInsurance,
  calculate_health_insurance: calculateHealthInsurance,
  calculate_pension: calculatePension,
  calculate_employer_cost: calculateEmployerCost,
  get_salary_grade: getSalaryGrade,
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
