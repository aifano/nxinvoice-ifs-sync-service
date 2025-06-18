import { PrismaClient } from '@prisma/client';
import { IfsTableSynchronizationAction, IfsTableSynchronizationResult } from './ifs-table-synchronization';

export interface IfsTableSynchronizationHandler {
  handleTableSynchronization(
    synchronizationAction: IfsTableSynchronizationAction,
    organizationId: string,
    ifsTableData: any
  ): Promise<IfsTableSynchronizationResult>;
  
  getIfsTableName(): string;
  getTargetDatabaseTableName(): string;
  getSupportedSynchronizationActions(): IfsTableSynchronizationAction[];
}

export interface IfsTableSynchronizationHandlerFactory {
  createTableSynchronizationHandler(ifsTableName: string): IfsTableSynchronizationHandler | null;
  registerNewTableSynchronizationHandler(ifsTableName: string, handlerClass: new (prismaClient: PrismaClient) => IfsTableSynchronizationHandler): void;
  getAllSupportedIfsTableNames(): string[];
}