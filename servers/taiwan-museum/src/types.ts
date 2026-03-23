export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface ShowInfo {
  time?: string;
  location?: string;
  locationName?: string;
  price?: string;
  endTime?: string;
}

export interface MuseumRecord {
  title?: string;
  category?: string;
  showInfo?: ShowInfo[];
  showUnit?: string;
  location?: string;
  sourceWebPromote?: string;
  startDate?: string;
  endDate?: string;
  descriptionFilterHtml?: string;
  imageUrl?: string;
  masterUnit?: string[];
  hitRate?: number;
}
