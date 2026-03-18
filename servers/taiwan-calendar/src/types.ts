export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface HolidayRecord {
  date: string;
  name: string;
  isHoliday: string;
  holidayCategory: string;
  description: string;
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

export interface LunarDate {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  zodiac: string;
  heavenlyStem: string;
  earthlyBranch: string;
  ganzhiYear: string;
}
