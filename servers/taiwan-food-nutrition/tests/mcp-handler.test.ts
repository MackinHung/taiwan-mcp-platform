import { describe, it, expect, vi } from 'vitest';

// Mock all tool modules
vi.mock('../src/tools/search-nutrition.js', () => ({
  searchFoodNutrition: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'search-nutrition' }] }),
}));
vi.mock('../src/tools/food-details.js', () => ({
  getFoodDetails: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'food-details' }] }),
}));
vi.mock('../src/tools/compare-foods.js', () => ({
  compareFoods: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'compare-foods' }] }),
}));
vi.mock('../src/tools/search-by-nutrient.js', () => ({
  searchByNutrient: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'search-nutrient' }] }),
}));
vi.mock('../src/tools/food-categories.js', () => ({
  getFoodCategories: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'food-categories' }] }),
}));

import { handleRpcRequest, TOOL_DEFINITIONS } from '../src/mcp-handler.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-food-nutrition',
  SERVER_VERSION: '1.0.0',
};

describe('handleRpcRequest', () => {
  describe('initialize', () => {
    it('returns server info with name, version, capabilities', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {},
      });
      expect(result.jsonrpc).toBe('2.0');
      expect(result.id).toBe(1);
      expect((result.result as any).protocolVersion).toBe('2024-11-05');
      expect((result.result as any).serverInfo.name).toBe('taiwan-food-nutrition');
      expect((result.result as any).serverInfo.version).toBe('1.0.0');
      expect((result.result as any).capabilities).toHaveProperty('tools');
    });
  });

  describe('tools/list', () => {
    it('returns all 5 tools with correct schemas', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      });
      const tools = (result.result as any).tools;
      expect(tools).toHaveLength(5);
      const names = tools.map((t: any) => t.name);
      expect(names).toContain('search_food_nutrition');
      expect(names).toContain('get_food_details');
      expect(names).toContain('compare_foods');
      expect(names).toContain('search_by_nutrient');
      expect(names).toContain('get_food_categories');

      // Verify each tool has inputSchema
      for (const tool of tools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  describe('tools/call', () => {
    it('routes to correct handler for search_food_nutrition', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'search_food_nutrition', arguments: { keyword: '白米' } },
      });
      expect((result.result as any).content[0].text).toBe('search-nutrition');
    });

    it('routes to correct handler for get_food_details', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_food_details', arguments: { name: '白米飯' } },
      });
      expect((result.result as any).content[0].text).toBe('food-details');
    });

    it('routes to correct handler for compare_foods', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'compare_foods', arguments: { foods: ['白米飯', '雞胸肉'] } },
      });
      expect((result.result as any).content[0].text).toBe('compare-foods');
    });

    it('routes to correct handler for search_by_nutrient', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'search_by_nutrient', arguments: { nutrient: '蛋白質', minValue: 20 } },
      });
      expect((result.result as any).content[0].text).toBe('search-nutrient');
    });

    it('routes to correct handler for get_food_categories', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_food_categories', arguments: {} },
      });
      expect((result.result as any).content[0].text).toBe('food-categories');
    });

    it('returns MethodNotFound for invalid tool name', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: { name: 'nonexistent_tool', arguments: {} },
      });
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe(-32601);
      expect(result.error!.message).toContain('nonexistent_tool');
    });

    it('routes each tool correctly', async () => {
      const toolNames = [
        'search_food_nutrition',
        'get_food_details',
        'compare_foods',
        'search_by_nutrient',
        'get_food_categories',
      ];
      for (const name of toolNames) {
        const result = await handleRpcRequest(env, {
          jsonrpc: '2.0',
          id: 100,
          method: 'tools/call',
          params: { name, arguments: {} },
        });
        expect(result.error).toBeUndefined();
        expect(result.result).toBeDefined();
      }
    });
  });

  describe('error handling', () => {
    it('returns InvalidRequest when jsonrpc is missing', async () => {
      const result = await handleRpcRequest(env, {
        id: 5,
        method: 'initialize',
      } as any);
      expect(result.error!.code).toBe(-32600);
      expect(result.error!.message).toContain('Invalid Request');
    });

    it('returns InvalidRequest when method is missing', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 6,
      } as any);
      expect(result.error!.code).toBe(-32600);
    });

    it('returns MethodNotFound for unknown method', async () => {
      const result = await handleRpcRequest(env, {
        jsonrpc: '2.0',
        id: 7,
        method: 'unknown/method',
      });
      expect(result.error!.code).toBe(-32601);
      expect(result.error!.message).toContain('unknown/method');
    });
  });
});

describe('TOOL_DEFINITIONS', () => {
  it('has 5 tool definitions', () => {
    expect(TOOL_DEFINITIONS).toHaveLength(5);
  });

  it('each tool has name, description, and inputSchema', () => {
    for (const tool of TOOL_DEFINITIONS) {
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
    }
  });
});
