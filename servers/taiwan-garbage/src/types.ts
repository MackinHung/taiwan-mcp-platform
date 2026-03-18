export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
  MOENV_API_KEY?: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface GarbageTruckLocation {
  area: string;        // 行政區
  routeName: string;   // 路線名稱
  carNo: string;       // 車號
  longitude: number;
  latitude: number;
  gpsTime: string;     // GPS 時間
  city: string;        // 城市
}

export interface GarbageSchedule {
  area: string;
  route: string;
  scheduleDay: string;  // 星期幾
  scheduleTime: string; // 時間
  address: string;      // 收運點
  city: string;
}

export type SupportedCity = 'tainan' | 'new_taipei' | 'taoyuan' | 'kaohsiung' | 'taichung' | 'taipei';
