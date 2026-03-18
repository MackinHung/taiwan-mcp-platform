export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface PmsApiResponse {
  records: TenderRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface DataGovResponse {
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

export interface TenderRecord {
  tenderId?: string;
  tenderNo?: string;
  tenderName?: string;
  agency?: string;
  agencyCode?: string;
  tenderType?: string;
  tenderStatus?: string;
  publishDate?: string;
  deadline?: string;
  budget?: string;
  awardedVendor?: string;
  awardedAmount?: string;
  awardDate?: string;
  category?: string;
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  url?: string;
  // data.gov.tw fallback fields (Chinese)
  機關名稱?: string;
  標案名稱?: string;
  標案編號?: string;
  招標方式?: string;
  決標日期?: string;
  決標金額?: string;
  得標廠商?: string;
  公告日期?: string;
  截止日期?: string;
  預算金額?: string;
}
