export interface Env {
  MOA_API_KEY?: string;
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface AgriProduct {
  交易日期?: string;
  作物代號?: string;
  作物名稱?: string;
  市場代號?: string;
  市場名稱?: string;
  上價?: string;
  中價?: string;
  下價?: string;
  平均價?: string;
  交易量?: string;
  種類代碼?: string;
  種類名稱?: string;
}
