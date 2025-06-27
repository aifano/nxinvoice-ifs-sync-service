import { PrismaClient } from '@prisma/client';
import { IfsTableHandler } from '../../types/ifs-table-handler';
import { IfsTableSynchronizationResult } from '../../types/ifs-table-synchronization';
import { SqlLogger } from '../../utilities/sql-logger';

export class SupplierDocumentTaxHandler implements IfsTableHandler {

  constructor(private database: PrismaClient, private sqlLogger: SqlLogger) {}

  async handleOperation(action: string, organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    switch (action) {
      case 'insert':
        return this.insertSupplierTaxInfo(organizationId, data);
      case 'update':
        return this.updateSupplierTaxInfo(organizationId, data);
      case 'upsert':
        return this.upsertSupplierTaxInfo(organizationId, data);
      case 'delete':
        return {
          status: 200,
          message: 'Supplier tax information deletion not supported - operation skipped',
          success: true
        };
      default:
        return {
          status: 404,
          message: `Unsupported action: ${action}`,
          success: false
        };
    }
  }

  private async insertSupplierTaxInfo(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    const sqlStatement = this.buildSql('insert', data);
    let result: IfsTableSynchronizationResult;

    try {
      // Update supplier with tax information
      const updateResult = await this.database.supplier.updateMany({
        where: {
          organization_group_id: organizationId,
          supplier_id: data.supplier_id,
        },
        data: {
          vat_id: data.vat_id || null,
          tax_id: data.tax_id || null,
        },
      });

      if (updateResult.count === 0) {
        result = {
          status: 404,
          message: 'Supplier not found for tax information update',
          success: false
        };
      } else {
        result = {
          status: 200,
          message: 'Supplier tax information updated successfully',
          success: true
        };
      }
    } catch (error: any) {
      if (error.code === 'P2003') {
        result = {
          status: 400,
          message: 'Invalid organization or reference data',
          success: false
        };
      } else {
        result = {
          status: 500,
          message: 'Failed to update supplier tax information',
          success: false
        };
      }
    }

    // Immer loggen - auch bei Fehlern
    this.sqlLogger.logSqlStatement(sqlStatement, result.message);
    return result;
  }

  private async updateSupplierTaxInfo(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    const sqlStatement = this.buildSql('update', data);
    let result: IfsTableSynchronizationResult;

    try {
      const updateResult = await this.database.supplier.updateMany({
        where: {
          organization_group_id: organizationId,
          supplier_id: data.supplier_id,
        },
        data: {
          vat_id: data.vat_id || null,
          tax_id: data.tax_id || null,
        },
      });

      if (updateResult.count === 0) {
        result = {
          status: 404,
          message: 'Supplier not found for tax information update',
          success: false
        };
      } else {
        result = {
          status: 200,
          message: 'Supplier tax information updated successfully',
          success: true
        };
      }
    } catch (error: any) {
      result = {
        status: 500,
        message: 'Failed to update supplier tax information',
        success: false
      };
    }

    // Immer loggen - auch bei Fehlern
    this.sqlLogger.logSqlStatement(sqlStatement, result.message);
    return result;
  }

  private async upsertSupplierTaxInfo(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    // For tax info, upsert is the same as update since we're updating existing supplier records
    return this.updateSupplierTaxInfo(organizationId, data);
  }

  // SQL Statement Builder
  private buildSql(action: string, data: any): string {
    const tableName = 'suppliers';

    if (action === 'delete') {
      return `DELETE FROM "${tableName}" WHERE ROWKEY='${data.rowkey}'`;
    }

    if (action === 'insert' || action === 'upsert' || action === 'update') {
      const columns = Object.keys(data).map(key => `"${key.toUpperCase()}"`);
      const values = Object.values(data).map(value => `'${value}'`);
      const cols = columns.join(',');
      const vals = values.join(',');

      if (action === 'upsert') {
        const updateSet = Object.entries(data)
          .map(([k, v]) => `"${k.toUpperCase()}"='${v}'`)
          .join(',');
        return `INSERT INTO "${tableName}" (${cols}) VALUES (${vals}) ON CONFLICT ("ROWKEY") DO UPDATE SET ${updateSet}`;
      } else if (action === 'insert') {
        return `INSERT INTO "${tableName}" (${cols}) VALUES (${vals})`;
      } else if (action === 'update') {
        const updateSet = Object.entries(data)
          .filter(([k]) => k.toLowerCase() !== 'rowkey')
          .map(([k, v]) => `"${k.toUpperCase()}"='${v}'`)
          .join(',');
        return `UPDATE "${tableName}" SET ${updateSet} WHERE ROWKEY='${data.rowkey}'`;
      }
    }

    return `-- Unknown action: ${action}`;
  }
}
