export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * 大專校院名錄 record
 * Source: https://stats.moe.gov.tw/files/opendata/u1_new.json
 * Dataset #6091
 */
export interface UniversityRecord {
  學年度: string;
  代碼: string;
  學校名稱: string;
  '公/私立': string;
  縣市名稱: string;
  地址: string;
  電話: string;
  網址: string;
  體系別: string;
}

/**
 * 國民中學名錄 record
 * Source: https://stats.moe.gov.tw/files/opendata/j1_new.json
 */
export interface JuniorHighRecord {
  學年度: string;
  代碼: string;
  學校名稱: string;
  '公/私立': string;
  縣市名稱: string;
  地址: string;
  電話: string;
  網址: string;
}

/**
 * 高級中等學校名錄 record
 * Source: https://stats.moe.gov.tw/files/school/114/high.json
 * Dataset #6089
 */
export interface HighSchoolRecord {
  學年度: string;
  代碼: string;
  學校名稱: string;
  '公/私立': string;
  縣市名稱: string;
  地址: string;
  電話: string;
  網址: string;
  備註: string;
}

/**
 * Normalized school record used across all school types
 */
export interface SchoolRecord {
  name: string;
  code: string;
  level: string;
  publicPrivate: string;
  city: string;
  address: string;
  phone: string;
  website: string;
}
