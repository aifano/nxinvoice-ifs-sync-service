import { IfsTableSynchronizationResult } from './ifs-table-synchronization';

export interface IfsTableHandler {
  handleOperation(action: string, organizationId: string, data: any): Promise<IfsTableSynchronizationResult>;
}