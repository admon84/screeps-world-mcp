export interface ScreepsConfig {
  baseUrl: string;
  token?: string;
  username?: string;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ToolResult {
  [x: string]: unknown;
  content: Array<{
    [x: string]: unknown;
    type: 'text';
    text: string;
    _meta?: { [x: string]: unknown };
  }>;
  isError?: boolean;
  _meta?: { [x: string]: unknown };
}

export interface ResourceContent {
  [x: string]: unknown;
  contents: Array<{
    [x: string]: unknown;
    uri: string;
    text: string;
    mimeType?: string;
    _meta?: { [x: string]: unknown };
  }>;
  _meta?: { [x: string]: unknown };
}

export interface RoomCoordinates {
  x: number;
  y: number;
}

export interface IntervalOptions {
  interval?: '8' | '180' | '1440';
}

export interface ShardOptions {
  shard?: string;
}

export interface RoomOptions extends ShardOptions {
  room: string;
}

export interface UserFindOptions {
  id?: string;
  username?: string;
}

export interface MapStatsOptions extends ShardOptions {
  rooms: string[];
  statName: string;
}

export interface MarketOrderOptions {
  resourceType: string;
}

export interface MoneyHistoryOptions {
  page?: number;
}

export interface AuthSigninOptions {
  email: string;
  password: string;
}

export interface PvpInfoOptions {
  interval?: number;
  start?: number;
}

export interface UserMemoryOptions extends ShardOptions {
  path?: string;
}

export type StatName =
  | 'creepsLost'
  | 'creepsProduced'
  | 'energyConstruction'
  | 'energyControl'
  | 'energyCreeps'
  | 'energyHarvested';

export interface UserOverviewOptions extends IntervalOptions {
  statName?: StatName;
}

export interface RoomTerrainOptions extends RoomOptions {
  encoded?: boolean;
}

export interface RoomOverviewOptions extends RoomOptions, IntervalOptions {}

export interface DistanceCalculationOptions {
  from: string;
  to: string;
}
