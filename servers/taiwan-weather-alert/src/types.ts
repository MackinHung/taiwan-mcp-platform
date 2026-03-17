export interface Env {
  CWA_API_KEY: string;
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface CwaApiResponse<T = unknown> {
  success: string;
  result: {
    resource_id: string;
    fields: unknown[];
  };
  records: T;
}

export interface EarthquakeReport {
  EarthquakeNo: number;
  ReportContent: string;
  ReportColor: string;
  ReportImageURI: string;
  EarthquakeInfo: {
    OriginTime: string;
    Source: string;
    FocalDepth: number;
    EpiCenter: {
      Location: string;
      EpiCenterLat: number;
      EpiCenterLon: number;
    };
    EarthquakeMagnitude: {
      MagnitudeType: string;
      MagnitudeValue: number;
    };
  };
  Intensity?: {
    ShakingArea: Array<{
      AreaDesc: string;
      CountyName: string;
      InfoStatus: string;
      AreaIntensity: string;
    }>;
  };
}

export interface WeatherWarningRecords {
  record: Array<{
    datasetDescription: string;
    hazardConditions: {
      hazards: {
        hazard: Array<{
          info: { phenomena: string; significance: string };
          validTime: { startTime: string; endTime: string };
          affectedAreas: {
            location: Array<{ locationName: string }>;
          };
        }>;
      };
    };
  }>;
}

export interface TyphoonRecords {
  tropicalCyclones?: {
    tropicalCyclone?: Array<{
      typhoonName: string;
      cwaTyphoonName: string;
      analysisData?: {
        fixedDateTime: string;
        coordinate: string;
        maxWindSpeed?: { value: number; unit: string };
        gustSpeed?: { value: number; unit: string };
        pressure?: { value: number; unit: string };
        movingSpeed?: { value: number; unit: string };
        movingDirection?: string;
      };
      forecastData?: Array<{
        fixedTime: string;
        coordinateLat: number;
        coordinateLon: number;
        maxWindSpeed: number;
      }>;
    }>;
  };
}

export interface HeavyRainRecords {
  record: Array<{
    datasetDescription: string;
    hazardConditions: {
      hazards: {
        hazard: Array<{
          info: { phenomena: string; significance: string };
          validTime: { startTime: string; endTime: string };
          affectedAreas: {
            location: Array<{ locationName: string }>;
          };
        }>;
      };
    };
  }>;
}
