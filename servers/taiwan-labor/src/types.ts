export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface MinimumWageInfo {
  year: number;
  monthlyWage: number;
  hourlyWage: number;
  effectiveDate: string;
}

export interface LaborInsuranceRate {
  category: string;
  rate: number;
  employerShare: number;
  employeeShare: number;
  governmentShare: number;
}

export interface WageStatRecord {
  year?: string;
  industry?: string;
  averageWage?: string;
  medianWage?: string;
}

export interface OpenDataResponse<T = unknown> {
  success: boolean;
  result: {
    resource_id: string;
    fields: unknown[];
    records: T[];
    total: number;
  };
}
