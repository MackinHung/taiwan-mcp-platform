export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface ExchangeRate {
  currency: string;
  currencyCode: string;
  cashBuying: string;
  cashSelling: string;
  spotBuying: string;
  spotSelling: string;
}
