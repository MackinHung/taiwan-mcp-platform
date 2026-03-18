export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface DrugRecord {
  許可證字號?: string;
  中文品名?: string;
  英文品名?: string;
  適應症?: string;
  劑型?: string;
  藥品類別?: string;
  主成分略述?: string;
  申請商名稱?: string;
  申請商地址?: string;
  製造商名稱?: string;
  製造商地址?: string;
  有效日期?: string;
  發證日期?: string;
  許可證種類?: string;
  管制藥品分類級別?: string;
}
