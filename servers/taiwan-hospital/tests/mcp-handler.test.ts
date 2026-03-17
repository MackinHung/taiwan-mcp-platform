import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Env, JsonRpcRequest } from '../src/types.js';

vi.mock('../src/tools/facility.js', () => ({
  searchFacility: vi.fn(),
  getFacilityDetail: vi.fn(),
  getFacilitiesByArea: vi.fn(),
  getPharmacies: vi.fn(),
  listFacilityTypes: vi.fn(),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import {
  searchFacility,
  getFacilityDetail,
  getFacilitiesByArea,
  getPharmacies,
  listFacilityTypes,
} from '../src/tools/facility.js';

const mockSearch = vi.mocked(searchFacility);
const mockDetail = vi.mocked(getFacilityDetail);
const mockByArea = vi.mocked(getFacilitiesByArea);
const mockPharmacies = vi.mocked(getPharmacies);
const mockListTypes = vi.mocked(listFacilityTypes);

const env: Env = { SERVER_NAME: 'taiwan-hospital', SERVER_VERSION: '1.0.0' };

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
      serverInfo: { name: 'taiwan-hospital', version: '1.0.0' },
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
  it('dispatches search_facility', async () => {
    mockSearch.mockResolvedValueOnce({
      content: [{ type: 'text', text: '搜尋結果' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'search_facility', arguments: { keyword: '台大' } },
    });

    expect(mockSearch).toHaveBeenCalledWith(env, { keyword: '台大' });
  });

  it('dispatches get_facility_detail', async () => {
    mockDetail.mockResolvedValueOnce({
      content: [{ type: 'text', text: '詳情' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'get_facility_detail', arguments: { hosp_id: '123' } },
    });

    expect(mockDetail).toHaveBeenCalledWith(env, { hosp_id: '123' });
  });

  it('dispatches get_facilities_by_area', async () => {
    mockByArea.mockResolvedValueOnce({
      content: [{ type: 'text', text: '區域' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: { name: 'get_facilities_by_area', arguments: { area: '台北市' } },
    });

    expect(mockByArea).toHaveBeenCalledWith(env, { area: '台北市' });
  });

  it('dispatches get_pharmacies', async () => {
    mockPharmacies.mockResolvedValueOnce({
      content: [{ type: 'text', text: '藥局' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: { name: 'get_pharmacies', arguments: { area: '台北市' } },
    });

    expect(mockPharmacies).toHaveBeenCalledWith(env, { area: '台北市' });
  });

  it('dispatches list_facility_types', async () => {
    mockListTypes.mockResolvedValueOnce({
      content: [{ type: 'text', text: '類型' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: { name: 'list_facility_types', arguments: {} },
    });

    expect(mockListTypes).toHaveBeenCalledWith(env, {});
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

  it('passes empty args when arguments omitted', async () => {
    mockListTypes.mockResolvedValueOnce({
      content: [{ type: 'text', text: '類型' }],
    });

    await handleRpcRequest(env, {
      jsonrpc: '2.0',
      id: 9,
      method: 'tools/call',
      params: { name: 'list_facility_types' },
    });

    expect(mockListTypes).toHaveBeenCalledWith(env, {});
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
