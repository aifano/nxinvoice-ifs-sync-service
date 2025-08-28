export interface IfsRequest {
  action: string; // No restriction - accept any action
  data: Record<string, any>;
}

export interface IfsResponse {
  message: string;
  success: boolean;
  error?: string; // Optional field for internal error details (for logging)
}

export interface LogEntry {
  timestamp: string;
  organizationId: string;
  table: string;
  request: IfsRequest;
  response: IfsResponse;
  duration: number;
}

export interface SyncEvent {
  organizationId: string;
  tableName: string;
  rowkey: string;
  operation: string; // Any operation
  timestamp: Date;
  data?: Record<string, any>;
}
