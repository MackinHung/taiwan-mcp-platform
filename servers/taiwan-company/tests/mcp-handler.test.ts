import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env, JsonRpcRequest } from '../src/types.js';

vi.mock('../src/tools/company.js', () => ({
  searchCompany: vi.fn(),
  getCompanyDetail: vi.fn(),
  getCompanyDirectors: vi.fn(),
  getCompanyBusiness: vi.fn(),
  listCompanyStatus: vi.fn(),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import {
  searchCompany,
  getCompanyDetail,
  getCompanyDirectors,
  getCompanyBusiness,
  listCompanyStatus,
} from '../src/tools/company.js';

const mockSearch = vi.mocked(searchCompany);
const mockDetail = vi.mocked(getCompanyDetail);
const mockDirectors = vi.mocked(getCompanyDirectors);
const mockBusiness = vi.mocked(getCompanyBusiness);
const mockListStatus = vi.mocked(listCompanyStatus);

const env: Env = { SERVER_NAME: 'taiwan-company', SERVER_VERSION: '1.0.0' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TOOL_DEFINITIONS', () => {
  it('has 5 tools', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(5);
  });

  it('each tool has name, description, inputSchema', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema).toBeTruthy();
    }
  });
});

describe('initialize', () => {
  it('returns server info', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
    });
    expect(res.result).toEqual({
      protocolVersion: '2024-11-05',
      serverInfo: { name: 'taiwan-company', version: '1.0.0' },
      capabilities: { tools: {} },
    });
  });
});

describe('tools/list', () => {
  it('returns tool definitions', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
    });
    const result = res.result as { tools: unknown[] };
    expect(result.tools).toHaveLength(5);
  });
});

describe('tools/call', () => {
  it('dispatches search_company', async () => {
    mockSearch.mockResolvedValueOnce({
      content: [{ type: 'text', text: '結果' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'search_company', arguments: { keyword: '台積電' } },
    });

    expect(mockSearch).toHaveBeenCalledWith(env, { keyword: '台積電' });
  });

  it('dispatches get_company_detail', async () => {
    mockDetail.mockResolvedValueOnce({
      content: [{ type: 'text', text: '詳情' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'get_company_detail', arguments: { tax_id: '22099131' } },
    });

    expect(mockDetail).toHaveBeenCalledWith(env, { tax_id: '22099131' });
  });

  it('dispatches get_company_directors', async () => {
    mockDirectors.mockResolvedValueOnce({
      content: [{ type: 'text', text: '董監事' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: { name: 'get_company_directors', arguments: { tax_id: '22099131' } },
    });

    expect(mockDirectors).toHaveBeenCalledWith(env, { tax_id: '22099131' });
  });

  it('dispatches get_company_business', async () => {
    mockBusiness.mockResolvedValueOnce({
      content: [{ type: 'text', text: '營業項目' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: { name: 'get_company_business', arguments: { tax_id: '22099131' } },
    });

    expect(mockBusiness).toHaveBeenCalledWith(env, { tax_id: '22099131' });
  });

  it('dispatches list_company_status', async () => {
    mockListStatus.mockResolvedValueOnce({
      content: [{ type: 'text', text: '狀態' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: { name: 'list_company_status', arguments: {} },
    });

    expect(mockListStatus).toHaveBeenCalledWith(env, {});
  });

  it('returns error for unknown tool', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: { name: 'nonexistent' },
    });

    expect(res.error?.code).toBe(-32601);
  });
});

describe('error handling', () => {
  it('returns error for invalid jsonrpc', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '1.0',
      id: 10,
      method: 'initialize',
    } as JsonRpcRequest);

    expect(res.error?.code).toBe(-32600);
  });

  it('returns error for missing method', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 11,
    } as JsonRpcRequest);

    expect(res.error?.code).toBe(-32600);
  });

  it('returns error for unknown method', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 12,
      method: 'unknown/method',
    });

    expect(res.error?.code).toBe(-32601);
  });

  it('preserves request id', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 42,
      method: 'initialize',
    });

    expect(res.id).toBe(42);
  });

  it('uses null id when missing', async () => {
    const res = await handleRpcRequest(env, {
      jsonrpc: '2.0',
      method: 'initialize',
    });

    expect(res.id).toBeNull();
  });
});
