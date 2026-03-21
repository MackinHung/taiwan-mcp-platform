export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface ReservoirRecord {
  ReservoirName?: string;
  CatchmentAreaRainfall?: string;
  EffectiveCapacity?: string;
  CurrentCapacity?: string;
  CurrentCapacityPercent?: string;
  WaterInflow?: string;
  WaterOutflow?: string;
  WaterSupply?: string;
  UpdateTime?: string;
  [key: string]: string | undefined;
}

export const REGION_MAPPING: Record<string, string[]> = {
  '北': ['翡翠水庫', '石門水庫', '寶山第二水庫', '寶二水庫', '新山水庫'],
  '中': ['德基水庫', '鯉魚潭水庫', '日月潭水庫', '霧社水庫'],
  '南': ['曾文水庫', '南化水庫', '烏山頭水庫', '牡丹水庫', '阿公店水庫'],
  '東': ['鯉魚潭水庫(花蓮)'],
};
