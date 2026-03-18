export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export type FuelTypeCode = '92' | '95' | '98' | 'diesel';

export interface FuelPrice {
  fuelType: FuelTypeCode;
  fuelName: string;
  price: number;
  unit: string;
  effectiveDate: string;
}

export interface PriceChange {
  fuelType: FuelTypeCode;
  fuelName: string;
  previousPrice: number;
  currentPrice: number;
  change: number;
  effectiveDate: string;
}

export interface PriceHistoryRecord {
  fuelType: FuelTypeCode;
  fuelName: string;
  price: number;
  effectiveDate: string;
}

export interface CpcApiResponse {
  UpdateTime: string;
  PriceUpdate: Array<{
    ProdCode: string;
    ProdName: string;
    Price: string;
    EffectiveDate: string;
  }>;
}
