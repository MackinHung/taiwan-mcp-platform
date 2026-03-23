export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface Announcement {
  Index: number;
  SendUnitName: string;
  SendNo: string;
  Subject: string;
  DocDate: string;
  SendDate: string;
  DueDate: string;
}
