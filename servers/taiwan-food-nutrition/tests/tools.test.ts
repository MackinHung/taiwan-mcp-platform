import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module before importing tools
vi.mock('../src/client.js', () => ({
  DATASETS: { FOOD_NUTRITION: '20' },
  buildUrl: vi.fn(),
  fetchFoodNutritionData: vi.fn(),
}));

import { fetchFoodNutritionData } from '../src/client.js';
import { searchFoodNutrition } from '../src/tools/search-nutrition.js';
import { getFoodDetails } from '../src/tools/food-details.js';
import { compareFoods } from '../src/tools/compare-foods.js';
import { searchByNutrient } from '../src/tools/search-by-nutrient.js';
import { getFoodCategories } from '../src/tools/food-categories.js';
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

beforeEach(() => {
  mockFetchFoodNutritionData.mockReset();
});

// --- search_food_nutrition ---
describe('searchFoodNutrition', () => {
  it('returns matching foods by name', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await searchFoodNutrition(env, { keyword: '白米' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('白米飯');
    expect(result.content[0].text).toContain('183');
  });

  it('matches by alias (俗名)', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await searchFoodNutrition(env, { keyword: '波菜' });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('菠菜');
  });

  it('returns no-results message when nothing matches', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await searchFoodNutrition(env, { keyword: '不存在食品XYZ' });
    expect(result.content[0].text).toContain('查無名稱含「不存在食品XYZ」的食品');
  });

  it('returns error when keyword is empty', async () => {
    const result = await searchFoodNutrition(env, { keyword: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供食品名稱關鍵字');
  });

  it('returns error when keyword is missing', async () => {
    const result = await searchFoodNutrition(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供食品名稱關鍵字');
  });

  it('respects limit parameter', async () => {
    const manyFoods = Array.from({ length: 30 }, (_, i) => ({
      ...sampleFoods[0],
      '樣品名稱': `食品${i}`,
    }));
    mockFetchFoodNutritionData.mockResolvedValueOnce(manyFoods);
    const result = await searchFoodNutrition(env, { keyword: '食品', limit: 5 });
    expect(result.content[0].text).toContain('顯示 5 筆');
  });

  it('handles API error gracefully', async () => {
    mockFetchFoodNutritionData.mockRejectedValueOnce(new Error('API timeout'));
    const result = await searchFoodNutrition(env, { keyword: '測試' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('API timeout');
  });
});

// --- get_food_details ---
describe('getFoodDetails', () => {
  it('returns full nutrition details for valid food name', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await getFoodDetails(env, { name: '白米飯' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('食品完整營養資訊');
    expect(text).toContain('白米飯');
    expect(text).toContain('183');
    expect(text).toContain('3.1');
    expect(text).toContain('穀物類');
    expect(text).toContain('100');
  });

  it('shows all nutrient categories', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await getFoodDetails(env, { name: '菠菜' });
    const text = result.content[0].text;
    expect(text).toContain('熱量與三大營養素');
    expect(text).toContain('礦物質');
    expect(text).toContain('維生素');
    expect(text).toContain('81');  // 鈣
    expect(text).toContain('2.9'); // 鐵
    expect(text).toContain('331'); // 維生素A
  });

  it('returns no-results for non-existent food', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await getFoodDetails(env, { name: '不存在食品' });
    expect(result.content[0].text).toContain('查無食品「不存在食品」的營養資訊');
  });

  it('returns error when name is empty', async () => {
    const result = await getFoodDetails(env, { name: '' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供食品名稱');
  });

  it('returns error when name is missing', async () => {
    const result = await getFoodDetails(env, {});
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchFoodNutritionData.mockRejectedValueOnce(new Error('fetch failed'));
    const result = await getFoodDetails(env, { name: '白米飯' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('fetch failed');
  });
});

// --- compare_foods ---
describe('compareFoods', () => {
  it('compares two foods side by side', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await compareFoods(env, { foods: ['白米飯', '雞胸肉'] });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('食品營養比較');
    expect(text).toContain('白米飯');
    expect(text).toContain('雞胸肉');
    expect(text).toContain('183');
    expect(text).toContain('117');
  });

  it('shows warning for foods not found', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await compareFoods(env, { foods: ['白米飯', '不存在'] });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('未找到');
    expect(text).toContain('不存在');
  });

  it('returns error when all foods not found', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await compareFoods(env, { foods: ['不存在A', '不存在B'] });
    expect(result.content[0].text).toContain('查無任何指定食品的營養資料');
  });

  it('returns error when fewer than 2 foods provided', async () => {
    const result = await compareFoods(env, { foods: ['白米飯'] });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('至少 2 個');
  });

  it('returns error when more than 5 foods provided', async () => {
    const result = await compareFoods(env, {
      foods: ['a', 'b', 'c', 'd', 'e', 'f'],
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('最多比較 5 個');
  });

  it('returns error when foods is not provided', async () => {
    const result = await compareFoods(env, {});
    expect(result.isError).toBe(true);
  });

  it('returns error when foods is not an array', async () => {
    const result = await compareFoods(env, { foods: '白米飯' });
    expect(result.isError).toBe(true);
  });

  it('handles API error gracefully', async () => {
    mockFetchFoodNutritionData.mockRejectedValueOnce(new Error('server down'));
    const result = await compareFoods(env, { foods: ['白米飯', '雞胸肉'] });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('server down');
  });
});

// --- search_by_nutrient ---
describe('searchByNutrient', () => {
  it('finds high protein foods', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await searchByNutrient(env, { nutrient: '蛋白質', minValue: 20 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('雞胸肉');
    expect(result.content[0].text).not.toContain('白米飯');
  });

  it('finds high calcium foods', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await searchByNutrient(env, { nutrient: '鈣', minValue: 50 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('菠菜');
  });

  it('supports maxValue filter', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await searchByNutrient(env, {
      nutrient: '熱量',
      minValue: 100,
      maxValue: 150,
    });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('雞胸肉'); // 117 kcal
    expect(result.content[0].text).not.toContain('白米飯'); // 183 kcal
  });

  it('returns no results when nothing in range', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await searchByNutrient(env, { nutrient: '蛋白質', minValue: 100 });
    expect(result.content[0].text).toContain('查無');
  });

  it('returns error for unsupported nutrient', async () => {
    const result = await searchByNutrient(env, { nutrient: '不存在素', minValue: 10 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不支援的營養素');
  });

  it('returns error when nutrient is empty', async () => {
    const result = await searchByNutrient(env, { nutrient: '', minValue: 10 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供營養素名稱');
  });

  it('returns error when nutrient is missing', async () => {
    const result = await searchByNutrient(env, { minValue: 10 });
    expect(result.isError).toBe(true);
  });

  it('returns error when minValue is missing', async () => {
    const result = await searchByNutrient(env, { nutrient: '蛋白質' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供最小值');
  });

  it('respects limit parameter', async () => {
    const manyFoods = Array.from({ length: 30 }, (_, i) => ({
      ...sampleFoods[1],
      '樣品名稱': `高蛋白食品${i}`,
      '粗蛋白': '25',
    }));
    mockFetchFoodNutritionData.mockResolvedValueOnce(manyFoods);
    const result = await searchByNutrient(env, {
      nutrient: '蛋白質',
      minValue: 20,
      limit: 5,
    });
    expect(result.content[0].text).toContain('顯示 5 筆');
  });

  it('sorts results by nutrient value descending', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await searchByNutrient(env, { nutrient: '蛋白質', minValue: 2 });
    const text = result.content[0].text;
    const chickenIdx = text.indexOf('雞胸肉');
    const riceIdx = text.indexOf('白米飯');
    expect(chickenIdx).toBeLessThan(riceIdx); // 24.2 > 3.1
  });

  it('handles API error gracefully', async () => {
    mockFetchFoodNutritionData.mockRejectedValueOnce(new Error('rate limited'));
    const result = await searchByNutrient(env, { nutrient: '鈣', minValue: 10 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('rate limited');
  });
});

// --- get_food_categories ---
describe('getFoodCategories', () => {
  it('lists all categories with counts', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await getFoodCategories(env, {});
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('食品分類列表');
    expect(text).toContain('穀物類');
    expect(text).toContain('肉類');
    expect(text).toContain('蔬菜類');
    expect(text).toContain('3 個分類');
  });

  it('filters by specific category', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await getFoodCategories(env, { category: '穀物類' });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('穀物類');
    expect(text).toContain('白米飯');
    expect(text).toContain('1 項食品');
  });

  it('returns no results for non-existent category', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await getFoodCategories(env, { category: '不存在分類' });
    expect(result.content[0].text).toContain('查無分類「不存在分類」的食品');
  });

  it('handles foods with missing category', async () => {
    const dataWithMissing = [
      ...sampleFoods,
      { '樣品名稱': '未分類食品' },
    ];
    mockFetchFoodNutritionData.mockResolvedValueOnce(dataWithMissing);
    const result = await getFoodCategories(env, {});
    expect(result.content[0].text).toContain('未分類');
  });

  it('handles API error gracefully', async () => {
    mockFetchFoodNutritionData.mockRejectedValueOnce(new Error('connection refused'));
    const result = await getFoodCategories(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('connection refused');
  });

  it('shows calorie info when listing foods in category', async () => {
    mockFetchFoodNutritionData.mockResolvedValueOnce(sampleFoods);
    const result = await getFoodCategories(env, { category: '肉類' });
    expect(result.content[0].text).toContain('117');
  });
});
