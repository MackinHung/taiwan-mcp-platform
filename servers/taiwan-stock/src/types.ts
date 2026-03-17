export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface MarketSummary {
  Date: string;
  TradeVolume: string;
  TradeValue: string;
  Transaction: string;
  TAIEX: string;
  Change: string;
}

export interface MarketIndex {
  '日期': string;
  '指數': string;
  '收盤指數': string;
  '漲跌': string;
  '漲跌點數': string;
  '漲跌百分比': string;
  '特殊處理註記': string;
}

export interface TopVolumeStock {
  Date: string;
  Rank: string;
  Code: string;
  Name: string;
  TradeVolume: string;
  Transaction: string;
  OpeningPrice: string;
  HighestPrice: string;
  LowestPrice: string;
  ClosingPrice: string;
  Dir: string;
  Change: string;
  LastBestBidPrice: string;
  LastBestAskPrice: string;
}

export interface StockValuation {
  Date: string;
  Code: string;
  Name: string;
  PEratio: string;
  DividendYield: string;
  PBratio: string;
}

export interface StockDayAll {
  Date: string;
  Code: string;
  Name: string;
  TradeVolume: string;
  TradeValue: string;
  OpeningPrice: string;
  HighestPrice: string;
  LowestPrice: string;
  ClosingPrice: string;
  Change: string;
  Transaction: string;
}

export interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}
