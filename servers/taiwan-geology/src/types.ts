export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

// --- ARDSWC Landslide Alert ---
export interface LandslideAlert {
  AlertType: string;
  LandslideID: string;
  County: string;
  Town: string;
  Village: string;
  AlertLevel: string;
  LastUpdateDate: string;
  Latitude: number;
  Longitude: number;
}

// --- Active Fault CSV row ---
export interface ActiveFault {
  name: string;
  number: string;
  latitude: number;
  longitude: number;
  length_km: number;
  type: string;
  last_activity: string;
}

// --- Geological Sensitive Area (GeoJSON feature) ---
export interface SensitiveAreaFeature {
  type: 'Feature';
  properties: {
    SENSIT_ID: string;
    SENSIT_NAME: string;
    SENSIT_TYPE: string;
    COUNTY: string;
    TOWN: string;
    ANNOUNCE_DATE: string;
    AREA_HA: number;
  };
  geometry: {
    type: string;
    coordinates: number[] | number[][] | number[][][] | number[][][][];
  };
}

export interface SensitiveAreaGeoJSON {
  type: 'FeatureCollection';
  features: SensitiveAreaFeature[];
}

// --- WMS GetFeatureInfo response ---
export interface WmsFeatureInfo {
  layerName: string;
  features: Array<{
    properties: Record<string, string>;
  }>;
}

// --- Liquefaction potential ---
export interface LiquefactionResult {
  level: string;
  description: string;
  city: string;
  address: string;
}
