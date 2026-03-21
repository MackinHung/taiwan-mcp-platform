export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
  SPORTS_API_KEY?: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface FacilityRecord {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  district: string;
  sportTypes: string[];
  openHours: string;
  fee: string;
  lat: number;
  lng: number;
  facilities: string;
}
