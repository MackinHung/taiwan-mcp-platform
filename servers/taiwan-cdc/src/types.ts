export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface CkanResponse {
  success: boolean;
  result: {
    records: Record<string, string>[];
    total: number;
    fields: Array<{ id: string; type: string }>;
  };
}

export interface DiseaseRecord {
  疾病名稱?: string;
  通報病例數?: string;
  確定病例數?: string;
  年度?: string;
  週別?: string;
  地區?: string;
  性別?: string;
  年齡層?: string;
}

export interface VaccinationRecord {
  疫苗名稱?: string;
  接種劑次?: string;
  接種人數?: string;
  涵蓋率?: string;
  適用對象?: string;
  年度?: string;
}

export interface OutbreakRecord {
  通報日期?: string;
  疾病名稱?: string;
  通報地區?: string;
  病例數?: string;
  警示等級?: string;
  說明?: string;
}
