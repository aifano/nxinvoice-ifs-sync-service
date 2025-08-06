import { IfsTableHandler } from '../../types/ifs-table-handler';
import { IfsTableSynchronizationResult } from '../../types/ifs-table-synchronization';
import { supplierBankAddressOps } from '../repositories/supplier-bank-address-repository';

export class PaymentAddressHandler implements IfsTableHandler {

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
    let result: IfsTableSynchronizationResult;

    try {
      await supplierBankAddressOps.insert({
        company: data.company || '',
        identity: data.identity || '',
        supplier_name: data.supplier_name || null,
        bank_name: data.bank_name || null,
        account: data.account || null,
        bic_code: data.bic_code || null,
        default_address: data.default_address || 'FALSE',
        blocked_for_use: data.blocked_for_use || 'FALSE',
        way_id: data.way_id || null,
        address_id: data.address_id || null,
        rowkey: data.rowkey || null
      }, organizationId);

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

    return result;
  }

  private async updatePaymentAddress(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    let result: IfsTableSynchronizationResult;

    try {
      await supplierBankAddressOps.update({
        company: data.company || '',
        identity: data.identity || '',
        supplier_name: data.supplier_name || null,
        bank_name: data.bank_name || null,
        account: data.account || null,
        bic_code: data.bic_code || null,
        default_address: data.default_address || 'FALSE',
        blocked_for_use: data.blocked_for_use || 'FALSE',
        way_id: data.way_id || null,
        address_id: data.address_id || null,
        rowkey: data.rowkey || null
      }, organizationId);

      result = {
        status: 200,
        message: 'Payment address updated successfully',
        success: true
      };
    } catch (error: any) {
      result = {
        status: 500,
        message: 'Failed to update payment address',
        success: false
      };
    }

    return result;
  }

  private async upsertPaymentAddress(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    let result: IfsTableSynchronizationResult;

    try {
      // Erst versuchen zu aktualisieren
      await supplierBankAddressOps.upsert({
        company: data.company || '',
        identity: data.identity || '',
        supplier_name: data.supplier_name || null,
        bank_name: data.bank_name || null,
        account: data.account || null,
        bic_code: data.bic_code || null,
        default_address: data.default_address || 'FALSE',
        blocked_for_use: data.blocked_for_use || 'FALSE',
        way_id: data.way_id || null,
        address_id: data.address_id || null,
        rowkey: data.rowkey || null
      }, organizationId);
      result = {
        status: 200,
        message: 'Payment address updated via upsert',
        success: true
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        result = {
          status: 409,
          message: 'Payment address already exists',
          success: false
        };
      } else {
        result = {
          status: 500,
          message: 'Failed to create payment address via upsert',
          success: false
        };
      }
    }

    return result;
  }

  private async deletePaymentAddress(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    let result: IfsTableSynchronizationResult;

    try {
      await supplierBankAddressOps.delete({
        company: data.company || '',
        identity: data.identity || '',
        supplier_name: data.supplier_name || null,
        bank_name: data.bank_name || null,
        account: data.account || null,
        bic_code: data.bic_code || null,
        default_address: data.default_address || 'FALSE',
        blocked_for_use: data.blocked_for_use || 'FALSE',
        way_id: data.way_id || null,
        address_id: data.address_id || null,
        rowkey: data.rowkey || null
      }, organizationId);

      result = {
        status: 200,
        message: 'Payment address deleted successfully',
        success: true
      };
    } catch (error: any) {
      result = {
        status: 500,
        message: 'Failed to delete payment address',
        success: false
      };
    }

    return result;
  }
}
