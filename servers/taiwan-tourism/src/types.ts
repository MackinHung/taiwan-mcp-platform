export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface AttractionRecord {
  name: string;
  address: string;
  phone: string;
  openTime: string;
  ticketInfo: string;
  description: string;
  lat: string;
  lng: string;
  city: string;
  category: string;
  photoUrl: string;
}

export interface EventRecord {
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  city: string;
  category: string;
}

export interface AccommodationRecord {
  name: string;
  address: string;
  phone: string;
  grade: string;
  city: string;
  priceRange: string;
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
