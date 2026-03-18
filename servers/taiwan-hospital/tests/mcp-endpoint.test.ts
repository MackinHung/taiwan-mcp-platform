import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  FACILITY_TYPES: [
    { id: 'medical_center', name: '醫學中心', resourceId: 'A21030000I-D21001-003' },
    { id: 'regional_hospital', name: '區域醫院', resourceId: 'A21030000I-D21002-005' },
    { id: 'district_hospital', name: '地區醫院', resourceId: 'A21030000I-D21003-003' },
    { id: 'clinic', name: '診所', resourceId: 'A21030000I-D21004-009' },
    { id: 'pharmacy', name: '藥局', resourceId: 'A21030000I-D21005-001' },
  ],
  AREA_CODES: {
    '台北市': '63000',
    '高雄市': '64000',
  },
  fetchFacilities: vi.fn(),
  searchFacilitiesByName: vi.fn(),
  fetchMultipleTypes: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { searchFacilitiesByName, fetchFacilities, fetchMultipleTypes } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockSearchByName = vi.mocked(searchFacilitiesByName);
const mockFetchFacilities = vi.mocked(fetchFacilities);
const mockFetchMultipleTypes = vi.mocked(fetchMultipleTypes);

const env: Env = {
  SERVER_NAME: 'taiwan-hospital',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockSearchByName.mockReset();
    mockFetchFacilities.mockReset();
    mockFetchMultipleTypes.mockReset();
    const server = createMcpServer(env);
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: 'test-client', version: '1.0.0' });
    await client.connect(clientTransport);
    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  afterEach(async () => {
    await cleanup();
  });

  it('lists exactly 5 tools', async () => {
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(5);
  });

  it('lists tools with correct names', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'get_facilities_by_area',
      'get_facility_detail',
      'get_pharmacies',
      'list_facility_types',
      'search_facility',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const search = tools.find((t) => t.name === 'search_facility')!;
    expect(search.inputSchema.type).toBe('object');
    expect(search.inputSchema.properties).toHaveProperty('keyword');
    expect(search.inputSchema.properties).toHaveProperty('type');

    const listTypes = tools.find((t) => t.name === 'list_facility_types')!;
    expect(listTypes.inputSchema.type).toBe('object');
  });

  it('calls search_facility with required keyword', async () => {
    mockSearchByName.mockResolvedValue([
      {
        HOSP_ID: '0401180014',
        HOSP_NAME: '台大醫院',
        HOSP_CODE_CNAME: '醫學中心',
        TEL: '02-23123456',
        ADDRESS: '台北市中正區中山南路7號',
        BRANCH_TYPE_CNAME: '台北業務組',
        SPECIAL_TYPE: '',
        SERVICE_CNAME: '門診,急診,住院',
        FUNCTYPE_CNAME: '內科,外科,小兒科',
        CLOSESHOP: '',
        HOLIDAYDUTY_CNAME: '',
        HOLIDAY_REMARK_CNAME: '',
        GOVAREANO: '63000',
        CONT_S_DATE: '2000-01-01',
      },
    ]);

    const result = await client.callTool({
      name: 'search_facility',
      arguments: { keyword: '台大' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('台大醫院');
  });

  it('calls get_facility_detail with required hosp_id', async () => {
    mockFetchFacilities.mockResolvedValue([
      {
        HOSP_ID: '0401180014',
        HOSP_NAME: '台大醫院',
        HOSP_CODE_CNAME: '醫學中心',
        TEL: '02-23123456',
        ADDRESS: '台北市中正區中山南路7號',
        BRANCH_TYPE_CNAME: '台北業務組',
        SPECIAL_TYPE: '',
        SERVICE_CNAME: '門診,急診,住院',
        FUNCTYPE_CNAME: '內科,外科,小兒科',
        CLOSESHOP: '',
        HOLIDAYDUTY_CNAME: '',
        HOLIDAY_REMARK_CNAME: '',
        GOVAREANO: '63000',
        CONT_S_DATE: '2000-01-01',
      },
    ]);

    const result = await client.callTool({
      name: 'get_facility_detail',
      arguments: { hosp_id: '0401180014' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('台大醫院');
  });

  it('handles tool error gracefully', async () => {
    mockSearchByName.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'get_pharmacies',
      arguments: { keyword: '大樹' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-hospital');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls list_facility_types (no params)', async () => {
    const result = await client.callTool({
      name: 'list_facility_types',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('醫療機構類型');
  });

  it('calls get_facilities_by_area with required area', async () => {
    mockFetchMultipleTypes.mockResolvedValueOnce([
      {
        HOSP_ID: '0401180014',
        HOSP_NAME: '台大醫院',
        HOSP_CODE_CNAME: '醫學中心',
        TEL: '02-23123456',
        ADDRESS: '台北市中正區中山南路7號',
        BRANCH_TYPE_CNAME: '台北業務組',
        SPECIAL_TYPE: '',
        SERVICE_CNAME: '門診,急診,住院',
        FUNCTYPE_CNAME: '內科,外科,小兒科',
        CLOSESHOP: '',
        HOLIDAYDUTY_CNAME: '',
        HOLIDAY_REMARK_CNAME: '',
        GOVAREANO: '63000',
        CONT_S_DATE: '2000-01-01',
      },
    ]);

    const result = await client.callTool({
      name: 'get_facilities_by_area',
      arguments: { area: '台北市' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain('台北市');
  });
});
