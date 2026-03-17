export interface Env {
  CWA_API_KEY: string;
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface CwaApiResponse<T = unknown> {
  success: string;
  result: {
    resource_id: string;
    fields: unknown[];
  };
  records: T;
}

export interface ForecastLocation {
  locationName: string;
  weatherElement: WeatherElement[];
}

export interface WeatherElement {
  elementName: string;
  description: string;
  time: TimeEntry[];
}

export interface TimeEntry {
  startTime: string;
  endTime: string;
  elementValue: { value: string; measures: string }[];
}

export interface EarthquakeRecord {
  EarthquakeNo: number;
  ReportContent: string;
  ReportColor: string;
  EarthquakeInfo: {
    OriginTime: string;
    Source: string;
    FocalDepth: number;
    EpiCenter: { Location: string; EpiCenterLat: number; EpiCenterLon: number };
    EarthquakeMagnitude: { MagnitudeType: string; MagnitudeValue: number };
  };
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}
