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
