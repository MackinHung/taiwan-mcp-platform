export interface Env {
  MOENV_API_KEY: string;
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface AqiStation {
  sitename: string;
  county: string;
  aqi: string;
  pollutant: string;
  status: string;
  so2: string;
  co: string;
  o3: string;
  o3_8hr: string;
  pm10: string;
  'pm2.5': string;
  no2: string;
  nox: string;
  no: string;
  wind_speed: string;
  wind_direc: string;
  publishtime: string;
  pm2_5_avg: string;
  pm10_avg: string;
  co_8hr: string;
  so2_avg: string;
  longitude: string;
  latitude: string;
  siteid: string;
}

export interface MoenvApiResponse {
  fields: Array<{ id: string; info: { label: string } }>;
  resource_id: string;
  limit: number;
  offset: number;
  total: string;
  records: AqiStation[];
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
