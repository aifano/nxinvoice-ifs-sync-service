import { PrismaClient } from '@prisma/client';
import { IfsTableHandler } from '../../types/ifs-table-handler';
import { IfsTableSynchronizationResult } from '../../types/ifs-table-synchronization';
import { SqlLogger } from '../../utilities/sql-logger';

export class PaymentAddressHandler implements IfsTableHandler {

  constructor(private database: PrismaClient, private sqlLogger: SqlLogger) {}

  async handleOperation(action: string, organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    switch (action) {
      case 'insert':
        return this.insertPaymentAddress(organizationId, data);
      case 'update':
        return this.updatePaymentAddress(organizationId, data);
      case 'upsert':
        return this.upsertPaymentAddress(organizationId, data);
      case 'delete':
        return this.deletePaymentAddress(organizationId, data);
      default:
        return {
          status: 400,
          message: `Unsupported action: ${action}`,
          success: false
        };
    }
  }

  private async insertPaymentAddress(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    const sqlStatement = this.buildSql('insert', data);
    let result: IfsTableSynchronizationResult;

    try {
      await this.database.supplierBankAddresses.create({
        data: {
          tenant_id: organizationId,
          supplier_id: data.identity || '',
          supplier_name: data.supplier_name || null,
          bank_name: data.bank_name || null,
          iban: data.account || null,
          bic: data.bic_code || null,
          is_default: data.default_address === 'TRUE',
          blocked_for_use: data.blocked_for_use === 'TRUE',
          way_id: data.way_id || null,
          address_id: data.address_id || null,
          external_id: data.rowkey || null,
          organization_id: organizationId,
        },
      });

      result = {
        status: 200,
        message: 'Payment address created successfully',
        success: true
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        result = {
          status: 409,
          message: 'Payment address already exists',
          success: false
        };
      } else if (error.code === 'P2003') {
        result = {
          status: 400,
          message: 'Invalid organization or reference data',
          success: false
        };
      } else {
        result = {
          status: 500,
          message: 'Failed to create payment address',
          success: false
        };
      }
    }

    // Immer loggen - auch bei Fehlern
    this.sqlLogger.logSqlStatement(sqlStatement, result.message);
    return result;
  }

  private async updatePaymentAddress(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    const sqlStatement = this.buildSql('update', data);
    let result: IfsTableSynchronizationResult;

    try {
      const updateResult = await this.database.supplierBankAddresses.updateMany({
        where: {
          tenant_id: organizationId,
          external_id: data.rowkey,
        },
        data: {
          supplier_id: data.identity || '',
          supplier_name: data.supplier_name || null,
          bank_name: data.bank_name || null,
          iban: data.account || null,
          bic: data.bic_code || null,
          is_default: data.default_address === 'TRUE',
          blocked_for_use: data.blocked_for_use === 'TRUE',
          way_id: data.way_id || null,
          address_id: data.address_id || null,
        },
      });

      if (updateResult.count === 0) {
        result = {
          status: 404,
          message: 'Payment address not found',
          success: false
        };
      } else {
        result = {
          status: 200,
          message: 'Payment address updated successfully',
          success: true
        };
      }
    } catch (error: any) {
      result = {
        status: 500,
        message: 'Failed to update payment address',
        success: false
      };
    }

    // Immer loggen - auch bei Fehlern
    this.sqlLogger.logSqlStatement(sqlStatement, result.message);
    return result;
  }

  private async upsertPaymentAddress(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    const sqlStatement = this.buildSql('upsert', data);
    let result: IfsTableSynchronizationResult;

    try {
      const createResult = await this.database.supplierBankAddresses.createMany({
        data: {
          tenant_id: organizationId,
          supplier_id: data.identity || '',
          supplier_name: data.supplier_name || null,
          bank_name: data.bank_name || null,
          iban: data.account || null,
          bic: data.bic_code || null,
          is_default: data.default_address === 'TRUE',
          blocked_for_use: data.blocked_for_use === 'TRUE',
          way_id: data.way_id || null,
          address_id: data.address_id || null,
          external_id: data.rowkey || null,
          organization_id: organizationId,
        },
        skipDuplicates: true,
      });

      if (createResult.count === 0) {
        await this.updatePaymentAddress(organizationId, data);
        result = {
          status: 200,
          message: 'Payment address updated via upsert',
          success: true
        };
      } else {
        result = {
          status: 200,
          message: 'Payment address created via upsert',
          success: true
        };
      }
    } catch (error: any) {
      result = {
        status: 500,
        message: 'Failed to upsert payment address',
        success: false
      };
    }

    // Immer loggen - auch bei Fehlern
    this.sqlLogger.logSqlStatement(sqlStatement, result.message);
    return result;
  }

  private async deletePaymentAddress(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    const sqlStatement = this.buildSql('delete', data);
    let result: IfsTableSynchronizationResult;

    try {
      const deleteResult = await this.database.supplierBankAddresses.deleteMany({
        where: {
          tenant_id: organizationId,
          external_id: data.rowkey,
        },
      });

      if (deleteResult.count === 0) {
        result = {
          status: 404,
          message: 'Payment address not found',
          success: false
        };
      } else {
        result = {
          status: 200,
          message: 'Payment address deleted successfully',
          success: true
        };
      }
    } catch (error: any) {
      result = {
        status: 500,
        message: 'Failed to delete payment address',
        success: false
      };
    }

    // Immer loggen - auch bei Fehlern
    this.sqlLogger.logSqlStatement(sqlStatement, result.message);
    return result;
  }

  // SQL Statement Builder
  private buildSql(action: string, data: any): string {
    const tableName = 'supplier_bank_addresses';

    if (action === 'delete') {
      return `DELETE FROM "${tableName}" WHERE ROWKEY='${data.rowkey}'`;
    }

    if (action === 'insert' || action === 'upsert') {
      const columns = Object.keys(data).map(key => `"${key.toUpperCase()}"`);
      const values = Object.values(data).map(value => `'${value}'`);
      const cols = columns.join(',');
      const vals = values.join(',');

      if (action === 'upsert') {
        const updateSet = Object.entries(data)
          .map(([k, v]) => `"${k.toUpperCase()}"='${v}'`)
          .join(',');
        return `INSERT INTO "${tableName}" (${cols}) VALUES (${vals}) ON CONFLICT ("ROWKEY") DO UPDATE SET ${updateSet}`;
      } else {
        return `INSERT INTO "${tableName}" (${cols}) VALUES (${vals})`;
      }
    }

    if (action === 'update') {
      const updateSet = Object.entries(data)
        .filter(([k]) => k.toLowerCase() !== 'rowkey')
        .map(([k, v]) => `"${k.toUpperCase()}"='${v}'`)
        .join(',');
      return `UPDATE "${tableName}" SET ${updateSet} WHERE ROWKEY='${data.rowkey}'`;
    }

    return `-- Unknown action: ${action}`;
  }
}
