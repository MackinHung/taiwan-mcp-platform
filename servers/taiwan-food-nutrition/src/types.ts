export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface FoodNutritionRecord {
  樣品名稱?: string;
  俗名?: string;
  食品分類?: string;
  每單位重?: string;
  熱量?: string;
  粗蛋白?: string;
  總脂肪?: string;
  飽和脂肪?: string;
  碳水化合物?: string;
  糖?: string;
  膳食纖維?: string;
  鈉?: string;
  鈣?: string;
  鐵?: string;
  '維生素A'?: string;
  '維生素C'?: string;
  '維生素E'?: string;
}
