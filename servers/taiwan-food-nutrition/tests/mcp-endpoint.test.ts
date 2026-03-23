import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock client module before importing mcp-server
vi.mock('../src/client.js', () => ({
  DATASETS: { FOOD_NUTRITION: '20' },
  buildUrl: vi.fn(),
  fetchFoodNutritionData: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { fetchFoodNutritionData } from '../src/client.js';
import { createMcpServer } from '../src/mcp-server.js';
import type { Env } from '../src/types.js';

const mockFetchFoodNutritionData = vi.mocked(fetchFoodNutritionData);

const env: Env = {
  SERVER_NAME: 'taiwan-food-nutrition',
  SERVER_VERSION: '1.0.0',
};

const sampleFoods = [
  {
    '樣品名稱': '白米飯',
    '俗名': '飯',
    '食品分類': '穀物類',
    '每單位重': '100',
    '熱量': '183',
    '粗蛋白': '3.1',
    '總脂肪': '0.3',
    '飽和脂肪': '0.1',
    '碳水化合物': '41.0',
    '糖': '0',
    '膳食纖維': '0.3',
    '鈉': '2',
    '鈣': '5',
    '鐵': '0.2',
    '維生素A': '0',
    '維生素C': '0',
    '維生素E': '0',
  },
  {
    '樣品名稱': '雞胸肉',
    '俗名': '雞肉',
    '食品分類': '肉類',
    '每單位重': '100',
    '熱量': '117',
    '粗蛋白': '24.2',
    '總脂肪': '1.9',
    '飽和脂肪': '0.5',
    '碳水化合物': '0',
    '糖': '0',
    '膳食纖維': '0',
    '鈉': '52',
    '鈣': '4',
    '鐵': '0.4',
    '維生素A': '9',
    '維生素C': '0',
    '維生素E': '0.2',
  },
  {
    '樣品名稱': '菠菜',
    '俗名': '波菜',
    '食品分類': '蔬菜類',
    '每單位重': '100',
    '熱量': '22',
    '粗蛋白': '2.2',
    '總脂肪': '0.3',
    '飽和脂肪': '0.1',
    '碳水化合物': '3.4',
    '糖': '0.5',
    '膳食纖維': '2.4',
    '鈉': '37',
    '鈣': '81',
    '鐵': '2.9',
    '維生素A': '331',
    '維生素C': '35',
    '維生素E': '2.1',
  },
];

describe('MCP Streamable HTTP endpoint', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    mockFetchFoodNutritionData.mockReset();
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
      'compare_foods',
      'get_food_categories',
      'get_food_details',
      'search_by_nutrient',
      'search_food_nutrition',
    ]);
  });

  it('tools have Zod-derived inputSchema with descriptions', async () => {
    const { tools } = await client.listTools();
    const searchNutrition = tools.find((t) => t.name === 'search_food_nutrition')!;
    expect(searchNutrition.inputSchema.type).toBe('object');
    expect(searchNutrition.inputSchema.properties).toHaveProperty('keyword');
    expect(searchNutrition.inputSchema.properties).toHaveProperty('limit');

    const details = tools.find((t) => t.name === 'get_food_details')!;
    expect(details.inputSchema.type).toBe('object');
    expect(details.inputSchema.properties).toHaveProperty('name');
  });

  it('calls search_food_nutrition with keyword param', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);

    const result = await client.callTool({
      name: 'search_food_nutrition',
      arguments: { keyword: '白米' },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toBeDefined();
  });

  it('calls get_food_details with name param', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);

    const result = await client.callTool({
      name: 'get_food_details',
      arguments: { name: '白米飯' },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls compare_foods with foods param', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);

    const result = await client.callTool({
      name: 'compare_foods',
      arguments: { foods: ['白米飯', '雞胸肉'] },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls search_by_nutrient with nutrient and minValue params', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);

    const result = await client.callTool({
      name: 'search_by_nutrient',
      arguments: { nutrient: '蛋白質', minValue: 20 },
    });
    expect(result.isError).toBeFalsy();
  });

  it('calls get_food_categories without params', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);

    const result = await client.callTool({
      name: 'get_food_categories',
      arguments: {},
    });
    expect(result.isError).toBeFalsy();
  });

  it('handles tool error gracefully', async () => {
    mockFetchFoodNutritionData.mockRejectedValueOnce(new Error('API timeout'));

    const result = await client.callTool({
      name: 'search_food_nutrition',
      arguments: { keyword: '測試' },
    });
    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('API timeout');
  });

  it('server reports correct name and version', async () => {
    const info = client.getServerVersion();
    expect(info?.name).toBe('taiwan-food-nutrition');
    expect(info?.version).toBe('1.0.0');
  });
});
