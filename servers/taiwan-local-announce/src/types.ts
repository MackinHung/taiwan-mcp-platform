export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export type CityId = 'taipei' | 'newtaipei' | 'taoyuan' | 'taichung' | 'tainan' | 'kaohsiung';

export interface LocalAnnouncement {
  title: string;
  date: string;       // Normalized to YYYY-MM-DD
  content: string;    // Plain text (HTML stripped)
  city: CityId;
  agency: string;     // Publishing unit/department
  category: string;   // Category/classification
  url: string;        // Link to original article
}

export const CITY_NAMES: Record<CityId, string> = {
  taipei: '台北市',
  newtaipei: '新北市',
  taoyuan: '桃園市',
  taichung: '台中市',
  tainan: '台南市',
  kaohsiung: '高雄市',
};

export const ALL_CITY_IDS: CityId[] = [
  'taipei', 'newtaipei', 'taoyuan', 'taichung', 'tainan', 'kaohsiung',
];
