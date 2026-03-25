export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

// --- WRA Open Data API response types ---

export interface WraApiResponse<T = unknown> {
  responseCode: string;
  responseMessage: string;
  responseData: T[];
}

/** 淹水潛勢資料 (data.gov.tw dataset 53564) */
export interface FloodPotentialRecord {
  County: string;
  Town: string;
  Village: string;
  ReturnPeriod: string;
  FloodDepth: string;
  UpdateTime: string;
}

/** 河川水位觀測資料 (data.gov.tw dataset 25768) */
export interface RiverWaterLevelRecord {
  StationIdentifier: string;
  StationName: string;
  RiverName: string;
  WaterLevel: string;
  RecordTime: string;
  WarningLevel1: string;
  WarningLevel2: string;
  WarningLevel3: string;
}

/** 雨量觀測資料 (data.gov.tw dataset 9177) */
export interface RainfallRecord {
  StationIdentifier: string;
  StationName: string;
  CityName: string;
  Rainfall10min: string;
  Rainfall1hr: string;
  Rainfall3hr: string;
  Rainfall6hr: string;
  Rainfall12hr: string;
  Rainfall24hr: string;
  RecordTime: string;
}

/** 水庫水情資料 (data.gov.tw dataset 45501) */
export interface ReservoirRecord {
  ReservoirIdentifier: string;
  ReservoirName: string;
  EffectiveCapacity: string;
  CurrentCapacity: string;
  PercentageOfStorage: string;
  WaterInflow: string;
  WaterOutflow: string;
  RecordTime: string;
}

// --- Civil IoT SensorThings API response types ---

export interface SensorThingsResponse<T = unknown> {
  value: T[];
  '@iot.nextLink'?: string;
}

export interface SensorThingsObservation {
  phenomenonTime: string;
  result: number | string;
  resultTime: string;
}

export interface SensorThingsDatastream {
  '@iot.id': number;
  name: string;
  description: string;
  observationType: string;
  Thing: {
    name: string;
    description: string;
    properties?: Record<string, unknown>;
  };
  Observations: SensorThingsObservation[];
}

/** 淹水感測器警報 */
export interface FloodWarningRecord {
  stationName: string;
  stationId: string;
  waterLevel: number;
  warningLevel: string;
  observationTime: string;
  location?: string;
}
