export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface AccidentRecord {
  occurDate: string;       // 發生日期
  occurTime: string;       // 發生時間
  county: string;          // 縣市
  district: string;        // 區域
  address: string;         // 地點
  accidentType: string;    // A1/A2
  deathCount: number;      // 死亡人數
  injuryCount: number;     // 受傷人數
  vehicleTypes: string;    // 涉及車種
  weatherCondition: string; // 天候
  roadCondition: string;   // 路面狀況
  lightCondition: string;  // 照明
  cause: string;           // 肇事原因
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
