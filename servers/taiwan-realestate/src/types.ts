export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/** Single transaction record from regional open data APIs */
export interface TransactionRecord {
  /** 鄉鎮市區 */
  district?: string;
  /** 交易標的 */
  transaction_sign?: string;
  /** 土地區段位置 / 土地位置建物門牌 */
  address?: string;
  /** 土地移轉總面積(平方公尺) */
  land_area?: string;
  /** 都市土地使用分區 */
  land_use_zone?: string;
  /** 交易年月日 (民國年 or YYYYMMDD) */
  transaction_date?: string;
  /** 交易筆棟數 */
  transaction_count?: string;
  /** 總樓層數 */
  total_floor?: string;
  /** 建物型態 */
  building_type?: string;
  /** 主要用途 */
  main_use?: string;
  /** 主要建材 */
  main_material?: string;
  /** 建築完成年月 */
  construction_date?: string;
  /** 建物移轉總面積(平方公尺) */
  building_area?: string;
  /** 建物現況格局-房 */
  rooms?: string;
  /** 建物現況格局-廳 */
  halls?: string;
  /** 建物現況格局-衛 */
  bathrooms?: string;
  /** 有無管理組織 */
  has_management?: string;
  /** 總價(元) */
  total_price?: string;
  /** 單價(元/平方公尺) */
  unit_price?: string;
  /** 車位類別 */
  parking_type?: string;
  /** 車位總價(元) */
  parking_price?: string;
  /** 備註 */
  note?: string;
  /** 編號 */
  serial_number?: string;
  [key: string]: string | undefined;
}

/** Normalized transaction for display */
export interface NormalizedTransaction {
  date: string;
  address: string;
  totalPrice: number;
  unitPrice: number;
  buildingArea: number;
  buildingType: string;
  rooms: string;
  floors: string;
  age: string;
  note: string;
}

/** Price statistics result */
export interface PriceStatistics {
  avgUnitPrice: number;
  medianUnitPrice: number;
  maxUnitPrice: number;
  minUnitPrice: number;
  totalTransactions: number;
  avgTotalPrice: number;
}

/** Trend data point */
export interface TrendDataPoint {
  period: string;
  avgUnitPrice: number;
  transactionCount: number;
  changePercent: number | null;
}
