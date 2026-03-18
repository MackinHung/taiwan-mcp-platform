export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
  NCDR_API_KEY?: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface AlertRecord {
  alertId?: string;
  alertType?: string;
  alertTypeName?: string;
  severity?: string;
  area?: string;
  description?: string;
  sender?: string;
  effective?: string;
  expires?: string;
  updateTime?: string;
  magnitude?: string;
  depth?: string;
  epicenter?: string;
  [key: string]: string | undefined;
}

export const ALERT_TYPE_MAPPING: Record<string, string[]> = {
  earthquake: ['地震'],
  typhoon: ['颱風'],
  heavy_rain: ['豪雨', '大雨', '超大豪雨', '大豪雨'],
  flood: ['淹水', '水災', '洪水'],
  landslide: ['土石流', '坡地災害'],
  air_quality: ['空氣品質', '空品'],
  strong_wind: ['強風', '陸上強風'],
};

export const ALERT_TYPE_NAMES: Record<string, string> = {
  earthquake: '地震',
  typhoon: '颱風',
  heavy_rain: '豪雨',
  flood: '水災',
  landslide: '土石流',
  air_quality: '空氣品質',
  strong_wind: '強風',
};
