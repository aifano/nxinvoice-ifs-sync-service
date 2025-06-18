import { PrismaClient } from '@prisma/client';
import { IfsTableSynchronizationRequest, IfsTableSynchronizationResult } from '../types/ifs-table-synchronization';
import { mapPrismaErrorToSynchronizationResult } from '../utilities/prisma-error-mapper';
import { IfsTableSqlAuditLogger, buildSqlStatementForAuditLogging } from '../utilities/ifs-table-sql-audit-logger';
import { OrganizationContextJsonLogger } from '../utilities/organization-context-json-logger';
import { IfsTableSynchronizationHandlerFactory } from './ifs-table-synchronization-handler-factory';
import { IfsTableSynchronizationResponseMessage, IfsTableSynchronizationErrorType } from '../types/ifs-table-synchronization-response-messages';

export class IfsTableSynchronizationService {
  private ifsTableSynchronizationHandlerFactory: IfsTableSynchronizationHandlerFactory;

  constructor(
    prismaClientForDatabaseOperations: PrismaClient,
    private organizationContextLogger: OrganizationContextJsonLogger,
    private sqlAuditLogger: IfsTableSqlAuditLogger,
    handlerFactory?: IfsTableSynchronizationHandlerFactory
  ) {
    this.ifsTableSynchronizationHandlerFactory = handlerFactory || new IfsTableSynchronizationHandlerFactory(
      prismaClientForDatabaseOperations,
      this.organizationContextLogger
    );
  }

  async synchronizeIfsTableData(
    ifsTableName: string,
    synchronizationRequest: IfsTableSynchronizationRequest
  ): Promise<IfsTableSynchronizationResult> {
    const { action, organization_id, data } = synchronizationRequest;
    const startTimeInMilliseconds = Date.now();

    this.organizationContextLogger.logInformationWithOrganizationContext(
      organization_id,
      `Starting IFS table synchronization`,
      { ifsTableName, synchronizationAction: action }
    );

    if (!this.isIfsTableSynchronizationSupported(ifsTableName)) {
      this.organizationContextLogger.logWarningWithOrganizationContext(
        organization_id,
        `Unsupported IFS table synchronization requested`,
        { requestedIfsTableName: ifsTableName, supportedTableNames: this.getSupportedIfsTableNames() }
      );
      return { 
        status: 400, 
        message: IfsTableSynchronizationResponseMessage.UNSUPPORTED_TABLE_NAME,
        success: false,
        error_type: IfsTableSynchronizationErrorType.UNSUPPORTED_TABLE
      };
    }

    if (!this.isSynchronizationActionValid(action)) {
      this.organizationContextLogger.logWarningWithOrganizationContext(
        organization_id,
        `Invalid synchronization action requested`,
        { requestedAction: action, validActions: ['insert', 'update', 'upsert', 'delete'] }
      );
      return { 
        status: 400, 
        message: IfsTableSynchronizationResponseMessage.INVALID_SYNCHRONIZATION_ACTION,
        success: false,
        error_type: IfsTableSynchronizationErrorType.INVALID_ACTION
      };
    }

    try {
      const synchronizationResult = await this.executeSynchronizationWithHandler(
        ifsTableName,
        action,
        organization_id,
        data
      );
      
      const executionTimeInMilliseconds = Date.now() - startTimeInMilliseconds;
      
      // Log SQL operation for audit purposes
      await this.logSynchronizationOperationForAudit(
        organization_id,
        ifsTableName,
        action,
        data,
        synchronizationResult.message,
        executionTimeInMilliseconds
      );
      
      this.organizationContextLogger.logInformationWithOrganizationContext(
        organization_id,
        `IFS table synchronization completed successfully`,
        { 
          ifsTableName, 
          synchronizationAction: action,
          result: synchronizationResult.message,
          executionTimeMs: executionTimeInMilliseconds
        }
      );
      
      return { 
        status: synchronizationResult.status, 
        message: synchronizationResult.message,
        success: synchronizationResult.success,
        error_type: synchronizationResult.error_type
      };
    } catch (synchronizationError) {
      const executionTimeInMilliseconds = Date.now() - startTimeInMilliseconds;
      
      this.organizationContextLogger.logErrorWithOrganizationContext(
        organization_id,
        `IFS table synchronization failed`,
        synchronizationError as Error,
        { 
          ifsTableName, 
          synchronizationAction: action,
          executionTimeMs: executionTimeInMilliseconds
        }
      );
      
      return mapPrismaErrorToSynchronizationResult(synchronizationError);
    }
  }

  registerNewIfsTableSynchronizationHandler(
    ifsTableName: string,
    handlerClass: new (prismaClient: PrismaClient) => any
  ): void {
    this.ifsTableSynchronizationHandlerFactory.registerNewTableSynchronizationHandler(
      ifsTableName,
      handlerClass
    );
    
    this.organizationContextLogger.logInformationWithOrganizationContext(
      'system',
      `New IFS table synchronization handler registered`,
      { ifsTableName, handlerClass: handlerClass.name }
    );
  }

  getSupportedIfsTableNames(): string[] {
    return this.ifsTableSynchronizationHandlerFactory.getAllSupportedIfsTableNames();
  }

  getNumberOfSupportedIfsTableNames(): number {
    return this.ifsTableSynchronizationHandlerFactory.getNumberOfRegisteredHandlers();
  }

  private async executeSynchronizationWithHandler(
    ifsTableName: string,
    synchronizationAction: string,
    organizationId: string,
    ifsTableData: any
  ): Promise<IfsTableSynchronizationResult> {
    const synchronizationHandler = this.ifsTableSynchronizationHandlerFactory.createTableSynchronizationHandler(ifsTableName);
    
    if (!synchronizationHandler) {
      throw new Error(`No synchronization handler available for IFS table: ${ifsTableName}`);
    }

    return await synchronizationHandler.handleTableSynchronization(
      synchronizationAction as any,
      organizationId,
      ifsTableData
    );
  }

  private async logSynchronizationOperationForAudit(
    organizationId: string,
    ifsTableName: string,
    synchronizationAction: string,
    ifsTableData: any,
    operationResult: string,
    executionTimeInMilliseconds: number
  ): Promise<void> {
    try {
      const sqlStatementForAudit = buildSqlStatementForAuditLogging(
        ifsTableName,
        synchronizationAction,
        organizationId,
        ifsTableData
      );

      await this.sqlAuditLogger.logIfsTableSqlOperationWithOrganizationContext(
        organizationId,
        ifsTableName,
        synchronizationAction,
        sqlStatementForAudit,
        operationResult,
        executionTimeInMilliseconds
      );
    } catch (auditLoggingError) {
      this.organizationContextLogger.logWarningWithOrganizationContext(
        organizationId,
        'Failed to log synchronization operation for audit',
        { auditLoggingError, ifsTableName, synchronizationAction }
      );
    }
  }

  private isIfsTableSynchronizationSupported(ifsTableName: string): boolean {
    return this.ifsTableSynchronizationHandlerFactory.isIfsTableSynchronizationSupported(ifsTableName);
  }

  private isSynchronizationActionValid(synchronizationAction: string): boolean {
    return ['insert', 'update', 'upsert', 'delete'].includes(synchronizationAction);
  }
}