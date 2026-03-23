export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface AnimalRecord {
  animalId: string;
  areaId: string;
  breed: string;
  species: string;
  sex: string;
  bodySize: string;
  color: string;
  age: string;
  status: string;
  location: string;
  shelterName: string;
  shelterAddress: string;
  shelterPhone: string;
  updateTime: string;
  imageUrl: string;
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
