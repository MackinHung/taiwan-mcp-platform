export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  input: string;
  format?: string;
  breakdown?: Record<string, unknown>;
  message: string;
}
