export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface YouBikeStation {
  sno: string;       // station number
  sna: string;       // station name (Chinese)
  snaen: string;     // station name (English)
  tot: number;       // total docks
  sbi: number;       // available bikes
  bemp: number;      // empty docks
  lat: number;
  lng: number;
  ar: string;        // address (Chinese)
  aren: string;      // address (English)
  sarea: string;     // district (Chinese)
  sareaen: string;   // district (English)
  act: number;       // active (0/1)
  mday: string;      // last update time
  srcUpdateTime: string;
  updateTime: string;
  infoTime: string;
  infoDate: string;
}

export type CityCode = 'taipei' | 'new_taipei' | 'taoyuan' | 'kaohsiung' | 'taichung' | 'hsinchu';
