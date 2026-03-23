export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface FireRecord {
  occurDate: string;
  occurTime: string;
  county: string;
  district: string;
  fireType: string;
  cause: string;
  deathCount: number;
  injuryCount: number;
  burnArea: number;
  propertyLoss: number;
}

export interface OpenDataResponse {
  success: boolean;
  result: {
    resource_id: string;
    fields: Array<{ id: string; type: string }>;
    records: Record<string, string>[];
    total: number;
    limit: number;
    offset: number;
  };
}
