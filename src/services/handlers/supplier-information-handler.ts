import { PrismaClient } from '@prisma/client';
import { IfsTableHandler } from '../../types/ifs-table-handler';
import { IfsTableSynchronizationResult } from '../../types/ifs-table-synchronization';
import { SqlLogger } from '../../utilities/sql-logger';

export class SupplierInformationHandler implements IfsTableHandler {

  constructor(private database: PrismaClient, private sqlLogger: SqlLogger) {}

  async handleOperation(action: string, organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    switch (action) {
      case 'insert':
        return this.insertSupplier(organizationId, data);
      case 'update':
        return this.updateSupplier(organizationId, data);
      case 'upsert':
        return this.upsertSupplier(organizationId, data);
      case 'delete':
        return this.deleteSupplier(organizationId, data);
      default:
        return {
          status: 400,
          message: `Unsupported action: ${action}`,
          success: false
        };
    }
  }

  private async insertSupplier(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    const sqlStatement = this.buildSql('insert', data);
    let result: IfsTableSynchronizationResult;

    try {
      await this.database.supplier.create({
        data: {
          supplier_id: data.supplier_id || '',
          name: data.name || '',
          organization_group_id: organizationId,
          external_id: data.rowkey || null,
        },
      });

      result = {
        status: 200,
        message: 'Supplier created successfully',
        success: true
      };
    } catch (error: any) {
      // Handle specific database errors with user-friendly messages
      if (error.code === 'P2002') {
        result = {
          status: 409,
          message: 'Supplier already exists',
          success: false
        };
      } else if (error.code === 'P2003') {
        result = {
          status: 400,
          message: 'Invalid organization or reference data',
          success: false
        };
      } else {
        // Generic error for any other database issues
        result = {
          status: 500,
          message: 'Failed to create supplier',
          success: false
        };
      }
    }

    // Immer loggen - auch bei Fehlern
    this.sqlLogger.logSqlStatement(sqlStatement, result.message);
    return result;
  }

  private async updateSupplier(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    const sqlStatement = this.buildSql('update', data, organizationId);
    let result: IfsTableSynchronizationResult;

    try {
      const updateResult = await this.database.supplier.updateMany({
        where: {
          organization_group_id: organizationId,
          external_id: data.rowkey,
        },
        data: {
          supplier_id: data.supplier_id || '',
          name: data.name || '',
        },
      });

      if (updateResult.count === 0) {
        result = {
          status: 404,
          message: 'Supplier not found',
          success: false
        };
      } else {
        result = {
          status: 200,
          message: 'Supplier updated successfully',
          success: true
        };
      }
    } catch (error: any) {
      result = {
        status: 500,
        message: 'Failed to update supplier',
        success: false
      };
    }

    // Immer loggen - auch bei Fehlern
    this.sqlLogger.logSqlStatement(sqlStatement, result.message);
    return result;
  }

  private async upsertSupplier(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    const sqlStatement = this.buildSql('upsert', data, organizationId);
    let result: IfsTableSynchronizationResult;

    try {
      // Erst versuchen zu aktualisieren
      const updateResult = await this.database.supplier.updateMany({
        where: {
          organization_group_id: organizationId,
          external_id: data.rowkey,
        },
        data: {
          supplier_id: data.supplier_id || '',
          name: data.name || '',
        },
      });

      if (updateResult.count === 0) {
        // Record existiert nicht, erstelle ihn
        try {
          await this.database.supplier.create({
            data: {
              supplier_id: data.supplier_id || '',
              name: data.name || '',
              organization_group_id: organizationId,
              external_id: data.rowkey || null,
            },
          });
          result = {
            status: 200,
            message: 'Supplier created via upsert',
            success: true
          };
        } catch (createError: any) {
          if (createError.code === 'P2002') {
            result = {
              status: 409,
              message: 'Supplier already exists',
              success: false
            };
          } else {
            result = {
              status: 500,
              message: 'Failed to create supplier via upsert',
              success: false
            };
          }
        }
      } else {
        result = {
          status: 200,
          message: 'Supplier updated via upsert',
          success: true
        };
      }
    } catch (error: any) {
      result = {
        status: 500,
        message: 'Failed to upsert supplier',
        success: false
      };
    }

    // Immer loggen - auch bei Fehlern
    this.sqlLogger.logSqlStatement(sqlStatement, result.message);
    return result;
  }

  private async deleteSupplier(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    const sqlStatement = this.buildSql('delete', data, organizationId);
    let result: IfsTableSynchronizationResult;

    try {
      const deleteResult = await this.database.supplier.deleteMany({
        where: {
          organization_group_id: organizationId,
          external_id: data.rowkey,
        },
      });

      if (deleteResult.count === 0) {
        result = {
          status: 404,
          message: 'Supplier not found',
          success: false
        };
      } else {
        result = {
          status: 200,
          message: 'Supplier deleted successfully',
          success: true
        };
      }
    } catch (error: any) {
      result = {
        status: 500,
        message: 'Failed to delete supplier',
        success: false
      };
    }

    // Immer loggen - auch bei Fehlern
    this.sqlLogger.logSqlStatement(sqlStatement, result.message);
    return result;
  }

  // SQL Statement Builder - WICHTIG: Diese SQL-Statements sind nur für Logging-Zwecke!
  // Sie werden NICHT ausgeführt und dienen nur der Audit-Dokumentation.
  private buildSql(action: string, data: any, organizationId?: string): string {
    const tableName = 'suppliers';

    if (action === 'delete') {
      return `DELETE FROM "${tableName}" WHERE external_id='${data.rowkey}' AND organization_group_id='${organizationId}'`;
    }

    if (action === 'insert' || action === 'upsert') {
      // Füge organization_group_id zu den Daten hinzu für korrekte SQL-Darstellung
      const dataWithOrg = { ...data, organization_group_id: organizationId };
      const columns = Object.keys(dataWithOrg).map(key => {
        // Mappe rowkey zu external_id für korrekte Spaltenbezeichnung
        if (key === 'rowkey') return '"EXTERNAL_ID"';
        return `"${key.toUpperCase()}"`;
      });
      const values = Object.values(dataWithOrg).map(value => `'${value}'`);
      const cols = columns.join(',');
      const vals = values.join(',');

      if (action === 'upsert') {
        const updateSet = Object.entries(dataWithOrg)
          .map(([k, v]) => {
            const colName = k === 'rowkey' ? 'EXTERNAL_ID' : k.toUpperCase();
            return `"${colName}"='${v}'`;
          })
          .join(',');
        return `INSERT INTO "${tableName}" (${cols}) VALUES (${vals}) ON CONFLICT ("EXTERNAL_ID", "ORGANIZATION_GROUP_ID") DO UPDATE SET ${updateSet}`;
      } else {
        return `INSERT INTO "${tableName}" (${cols}) VALUES (${vals})`;
      }
    }

    if (action === 'update') {
      const updateSet = Object.entries(data)
        .filter(([k]) => k.toLowerCase() !== 'rowkey')
        .map(([k, v]) => `"${k.toUpperCase()}"='${v}'`)
        .join(',');
      return `UPDATE "${tableName}" SET ${updateSet} WHERE external_id='${data.rowkey}' AND organization_group_id='${organizationId}'`;
    }

    return `-- Unknown action: ${action}`;
  }
}
