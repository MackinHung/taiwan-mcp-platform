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

export interface TrainTimetable {
  TrainDate: string;
  DailyTrainInfo: {
    TrainNo: string;
    Direction: number;
    TrainTypeName: NameType;
    StartingStationName: NameType;
    EndingStationName: NameType;
  };
  StopTimes: Array<{
    StopSequence: number;
    StationName: NameType;
    StationID: string;
    ArrivalTime: string;
    DepartureTime: string;
  }>;
}

export interface ThsrTimetable {
  TrainDate: string;
  DailyTrainInfo: {
    TrainNo: string;
    Direction: number;
    StartingStationName: NameType;
    EndingStationName: NameType;
  };
  StopTimes: Array<{
    StopSequence: number;
    StationName: NameType;
    StationID: string;
    ArrivalTime: string;
    DepartureTime: string;
  }>;
}

export interface TrainLiveBoard {
  StationName: NameType;
  TrainNo: string;
  Direction: number;
  TrainTypeName: NameType;
  EndingStationName: NameType;
  ScheduledArrivalTime?: string;
  ScheduledDepartureTime?: string;
  DelayTime: number;
}

export interface MetroRoute {
  RouteID: string;
  RouteName: NameType;
  LineID: string;
  Stations?: Array<{
    StationID: string;
    StationName: NameType;
    Sequence: number;
  }>;
}

export interface BusEstimate {
  PlateNumb?: string;
  RouteName: NameType;
  StopName: NameType;
  EstimateTime?: number;
  StopStatus: number;
  Direction: number;
}
