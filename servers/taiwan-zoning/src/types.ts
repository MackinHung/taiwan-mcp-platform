export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

// --- ArcGIS REST API types (Taipei) ---

export interface ArcGisFeature {
  attributes: Record<string, unknown>;
  geometry?: {
    rings?: number[][][];
    x?: number;
    y?: number;
  };
}

export interface ArcGisResponse {
  objectIdFieldName?: string;
  geometryType?: string;
  spatialReference?: { wkid: number };
  features: ArcGisFeature[];
  error?: { code: number; message: string; details?: string[] };
}

// --- Taichung API types ---

export interface TaichungZoneItem {
  zone_name: string;
  zone_code: string;
  area_sqm?: number;
  plan_name?: string;
  status?: string;
  approval_date?: string;
}

export interface TaichungApiResponse {
  success: boolean;
  result: TaichungZoneItem[];
  total?: number;
}

// --- NLSC types ---

export interface NlscFeature {
  type: string;
  properties: Record<string, unknown>;
  geometry?: unknown;
}

export interface NlscFeatureCollection {
  type: string;
  features: NlscFeature[];
}

// --- City bounding boxes for validation ---

export interface CityBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// --- Supported cities ---

export type SupportedCity =
  | '臺北市'
  | '台北市'
  | '臺中市'
  | '台中市'
  | '高雄市'
  | '新北市'
  | '桃園市'
  | '臺南市'
  | '台南市';
