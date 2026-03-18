import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  DATASET_IDS: {
    companyBasic: '5F64D864-61CB-4D0D-8AD9-492047CC1EA6',
    companySearch: '6BBA2268-1367-4B42-9CCA-BC17499EBE8C',
    companyBusiness: '236EE382-4942-41A9-BD03-CA0709025E7C',
    directors: '4E5F7653-1B91-4DDC-99D5-468530FAE396',
    taxIdVerify: '673F0FC0-B3A7-429F-9041-E9866836B66D',
  },
  COMPANY_STATUS: {
    '01': '核准設立',
    '02': '停業',
    '03': '解散/撤銷',
    '07': '廢止',
    '08': '破產',
  },
  lookupByTaxId: vi.fn(),
  searchByName: vi.fn(),
  getBusinessItems: vi.fn(),
  getDirectors: vi.fn(),
  formatRocDate: vi.fn((d: string) => d || '（無資料）'),
  formatCapital: vi.fn((a: number) => `${a} 元`),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { searchByName, lookupByTaxId, getDirectors, getBusinessItems } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockSearchByName = vi.mocked(searchByName);
const mockLookupByTaxId = vi.mocked(lookupByTaxId);
const mockGetDirectors = vi.mocked(getDirectors);
const mockGetBusinessItems = vi.mocked(getBusinessItems);

const env: Env = {
  SERVER_NAME: 'taiwan-company',
  SERVER_VERSION: '1.0.0',
};

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
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
      'get_company_business',
      'get_company_detail',
      'get_company_directors',
      'list_company_status',
      'search_company',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const search = tools.find((t) => t.name === 'search_company')!;
    expect(search.inputSchema.type).toBe('object');
    expect(search.inputSchema.properties).toHaveProperty('keyword');

    const status = tools.find((t) => t.name === 'list_company_status')!;
    expect(status.inputSchema.type).toBe('object');
  });

  it('calls search_company with keyword', async () => {
    mockSearchByName.mockResolvedValueOnce([
      {
        Business_Accounting_NO: '22099131',
        Company_Name: '台灣積體電路製造股份有限公司',
        Company_Status_Desc: '核准設立',
        Capital_Stock_Amount: 259303805000,
        Paid_In_Capital_Amount: 259303805000,
        Responsible_Name: '魏哲家',
        Company_Location: '新竹科學園區',
        Register_Organization_Desc: '經濟部商業司',
        Company_Setup_Date: '0760221',
        Change_Of_Approval_Data: '1130101',
        Revoke_App_Date: '',
        Case_Status: '01',
        Case_Status_Desc: '核准設立',
        Sus_App_Date: '',
        Sus_Beg_Date: '',
        Sus_End_Date: '',
      },
    ]);

    const result = await client.callTool({
      name: 'search_company',
      arguments: { keyword: '台積電' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('台灣積體電路');
  });

  it('calls get_company_detail with required tax_id', async () => {
    mockLookupByTaxId.mockResolvedValueOnce([
      {
        Business_Accounting_NO: '22099131',
        Company_Name: '台灣積體電路製造股份有限公司',
        Company_Status_Desc: '核准設立',
        Capital_Stock_Amount: 259303805000,
        Paid_In_Capital_Amount: 259303805000,
        Responsible_Name: '魏哲家',
        Company_Location: '新竹科學園區',
        Register_Organization_Desc: '經濟部商業司',
        Company_Setup_Date: '0760221',
        Change_Of_Approval_Data: '1130101',
        Revoke_App_Date: '',
        Case_Status: '01',
        Case_Status_Desc: '核准設立',
        Sus_App_Date: '',
        Sus_Beg_Date: '',
        Sus_End_Date: '',
      },
    ]);

    const result = await client.callTool({
      name: 'get_company_detail',
      arguments: { tax_id: '22099131' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('台灣積體電路');
  });

  it('handles tool error gracefully', async () => {
    mockSearchByName.mockRejectedValueOnce(new Error('GCIS API timeout'));

    const result = await client.callTool({
      name: 'search_company',
      arguments: { keyword: '台積電' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('GCIS API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-company');
    expect(info?.version).toBe('1.0.0');
  });

  it('calls list_company_status (no params)', async () => {
    const result = await client.callTool({
      name: 'list_company_status',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('公司登記狀態代碼');
  });

  it('calls get_company_directors with tax_id', async () => {
    mockGetDirectors.mockResolvedValueOnce([
      {
        Person_Position_Name: '董事長',
        Person_Name: '魏哲家',
        Juristic_Person_Name: '',
        Person_Shareholding: 100000,
      },
    ]);

    const result = await client.callTool({
      name: 'get_company_directors',
      arguments: { tax_id: '22099131' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('魏哲家');
  });
});
