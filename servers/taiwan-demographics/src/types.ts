export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface PopulationRecord {
  statistic_yyymm: string;
  district_code: string;
  site_id: string;
  county: string;
  town: string;
  village: string;
  household: number;
  population_total: number;
  population_male: number;
  population_female: number;
  birth_total: number;
  death_total: number;
  marry_pair: number;
  divorce_pair: number;
}

export interface OpenDataResponse {
  responseData: PopulationRecord[] | Record<string, string>[];
  responseMsg?: string;
}
