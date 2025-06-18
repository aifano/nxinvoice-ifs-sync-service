import { appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { OrganizationContextJsonLogger } from './organization-context-json-logger';

export interface IfsTableSqlAuditLogEntry {
  timestamp: string;
  organizationId: string;
  ifsTableName: string;
  synchronizationAction: string;
  sqlStatement: string;
  operationResult: string;
  executionTimeMs?: number;
}

export class IfsTableSqlAuditLogger {
  private organizationContextLogger: OrganizationContextJsonLogger;

  constructor(organizationContextLogger?: OrganizationContextJsonLogger) {
    this.organizationContextLogger = organizationContextLogger || new OrganizationContextJsonLogger();
  }

  async logIfsTableSqlOperationWithOrganizationContext(
    organizationId: string,
    ifsTableName: string,
    synchronizationAction: string,
    sqlStatementForAudit: string,
    operationResult: string,
    executionTimeInMilliseconds?: number
  ): Promise<void> {
    const sqlAuditLogEntry: IfsTableSqlAuditLogEntry = {
      timestamp: new Date().toISOString(),
      organizationId: organizationId,
      ifsTableName: ifsTableName,
      synchronizationAction: synchronizationAction,
      sqlStatement: sqlStatementForAudit,
      operationResult: operationResult,
      executionTimeMs: executionTimeInMilliseconds,
    };

    // IMMEDIATE SQL FILE LOGGING - Fire and forget to ensure persistence even if service crashes
    this.persistSqlAuditLogImmediately(sqlAuditLogEntry);
    
    // Console JSON logging for Docker/Grafana collection
    this.organizationContextLogger.logInformationWithOrganizationContext(
      organizationId,
      `SQL operation executed for IFS table synchronization`,
      {
        ifsTableName,
        synchronizationAction,
        operationResult,
        executionTimeMs: executionTimeInMilliseconds,
        sqlStatementHash: this.generateSqlStatementHash(sqlStatementForAudit),
      }
    );
  }

  private persistSqlAuditLogImmediately(auditLogEntry: IfsTableSqlAuditLogEntry): void {
    // Immediate synchronous file write - do not await to avoid blocking main flow
    setImmediate(async () => {
      try {
        await this.writeAuditLogEntryToFile(auditLogEntry);
      } catch (persistenceError) {
        // Fallback: Log to console as backup if file write fails
        console.error(`CRITICAL: SQL audit log persistence failed - Backup log entry:`, 
          JSON.stringify(auditLogEntry, null, 0));
      }
    });
  }

  private generateSqlStatementHash(sqlStatement: string): string {
    // Simple hash for SQL statement identification without exposing sensitive data in logs
    let hash = 0;
    for (let i = 0; i < sqlStatement.length; i++) {
      const char = sqlStatement.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private async writeAuditLogEntryToFile(auditLogEntry: IfsTableSqlAuditLogEntry): Promise<void> {
    const currentDateForFileName = auditLogEntry.timestamp.split('T')[0];
    const auditLogFileName = `logs/ifs-table-sync-audit-${currentDateForFileName}.jsonl`;
    
    // Ensure logs directory exists
    if (!existsSync('logs')) {
      await mkdir('logs', { recursive: true });
    }
    
    const jsonLogLine = JSON.stringify(auditLogEntry) + '\n';
    await appendFile(auditLogFileName, jsonLogLine);
  }
}

export function buildSqlStatementForAuditLogging(
  ifsTableName: string,
  synchronizationAction: string,
  organizationId: string,
  ifsTableData: any
): string {
  const targetDatabaseTableName = getTargetDatabaseTableNameFromIfsTableName(ifsTableName);
  
  switch (synchronizationAction) {
    case 'insert':
    case 'upsert':
      const insertColumnNames = Object.keys(ifsTableData).concat(['organization_id']).map(col => `"${col}"`).join(', ');
      const insertColumnValues = Object.values(ifsTableData).concat([organizationId]).map(val => `'${val}'`).join(', ');
      return `INSERT INTO "${targetDatabaseTableName}" (${insertColumnNames}) VALUES (${insertColumnValues}) ON CONFLICT DO UPDATE SET ...`;
    
    case 'update':
      const updateColumnAssignments = Object.entries(ifsTableData).map(([columnName, columnValue]) => `"${columnName}"='${columnValue}'`).join(', ');
      return `UPDATE "${targetDatabaseTableName}" SET ${updateColumnAssignments} WHERE rowkey='${ifsTableData.rowkey}' AND organization_id='${organizationId}'`;
    
    case 'delete':
      return `DELETE FROM "${targetDatabaseTableName}" WHERE rowkey='${ifsTableData.rowkey}' AND organization_id='${organizationId}'`;
    
    default:
      return `-- Unknown synchronization action: ${synchronizationAction}`;
  }
}

function getTargetDatabaseTableNameFromIfsTableName(ifsTableName: string): string {
  const ifsTableToTargetTableMapping: Record<string, string> = {
    'supplier_info_tab': 'suppliers',
    'payment_address_tab': 'supplier_bank_addresses',
    'supplier_document_tax_info_tab': 'suppliers'
  };
  return ifsTableToTargetTableMapping[ifsTableName] || ifsTableName;
}