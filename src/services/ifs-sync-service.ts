import { PrismaClient } from '@prisma/client';
import { IfsTableSynchronizationResult } from '../types/ifs-table-synchronization';
import { IfsTableHandlerFactory } from './ifs-table-handler-factory';
import { SqlLogger } from '../utilities/sql-logger';

export class IfsTableSynchronizationService {
  private handlerFactory: IfsTableHandlerFactory;
  private sqlLogger: SqlLogger;

  constructor(private database: PrismaClient) {
    this.sqlLogger = new SqlLogger();
    this.handlerFactory = new IfsTableHandlerFactory(database, this.sqlLogger);
  }

  async synchronizeTableData(
    tableName: string,
    action: string,
    organizationId: string,
    data: any
  ): Promise<IfsTableSynchronizationResult> {

    // 1. Determine handler for table
    const handler = this.handlerFactory.getHandler(tableName);
    if (!handler) {
      return {
        status: 400,
        message: `Unsupported table: ${tableName}`,
        success: false
      };
    }

    // 2. Validate action
    if (!this.isValidAction(action)) {
      return {
        status: 400,
        message: `Invalid action: ${action}`,
        success: false
      };
    }

    // 3. Pass task to handler
    try {
      return await handler.handleOperation(action, organizationId, data);
    } catch (error) {
      return {
        status: 500,
        message: `Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false
      };
    }
  }

  getSupportedTableNames(): string[] {
    return this.handlerFactory.getSupportedTableNames();
  }

  private isValidAction(action: string): boolean {
    return ['insert', 'update', 'upsert', 'delete'].includes(action);
  }
}
