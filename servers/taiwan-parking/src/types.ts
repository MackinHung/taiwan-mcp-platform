export interface Env {
  TDX_CLIENT_ID: string;
  TDX_CLIENT_SECRET: string;
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface TdxTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface NameType {
  Zh_tw: string;
  En: string;
}

export interface CarPark {
  CarParkID: string;
  CarParkName: NameType;
  Description?: string;
  OperatorName?: NameType;
  Address?: string;
  Telephone?: string;
  CarParkPosition?: {
    PositionLon: number;
    PositionLat: number;
  };
  TotalSpaces?: number;
  FareDescription?: string;
  IsPublic?: boolean;
  OperationType?: number;
  LiveOccupancyAvailable?: boolean;
  City?: string;
}

export interface ParkingAvailability {
  CarParkID: string;
  CarParkName?: NameType;
  AvailableSpaces?: number;
  TotalSpaces?: number;
  ChargeStationAvailableSpaces?: number;
  DataCollectTime?: string;
  Spaces?: Array<{
    SpaceType: number;
    NumberOfSpaces: number;
    AvailableSpaces: number;
  }>;
}

export interface ParkingRate {
  CarParkID: string;
  CarParkName?: NameType;
  FareDescription?: string;
  Fares?: Array<{
    FareType: number;
    FareDescription: string;
  }>;
}
