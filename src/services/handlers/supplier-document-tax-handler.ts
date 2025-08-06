import { IfsTableHandler } from '../../types/ifs-table-handler';
import { IfsTableSynchronizationResult } from '../../types/ifs-table-synchronization';
import { supplierDocumentTaxOps } from '../repositories/supplier-document-tax-repository';

export class SupplierDocumentTaxHandler implements IfsTableHandler {

  async handleOperation(action: string, organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    switch (action) {
      case 'insert':
        return this.insertSupplierTaxInfo(organizationId, data);
      case 'update':
        return this.updateSupplierTaxInfo(organizationId, data);
      case 'upsert':
        return this.upsertSupplierTaxInfo(organizationId, data);
      case 'delete':
        return this.deleteSupplierTaxInfo(organizationId, data);
      default:
        return {
          status: 404,
          message: `Unsupported action: ${action}`,
          success: false
        };
    }
  }

  private async insertSupplierTaxInfo(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    let result: IfsTableSynchronizationResult;

    try {
      await supplierDocumentTaxOps.insert({
        supplier_id: data.supplier_id || '',
        vat_id: data.vat_id || null,
        tax_id: data.tax_id || null,
        rowkey: data.rowkey || null
      }, organizationId);

      result = {
        status: 200,
        message: 'Supplier tax information updated successfully',
        success: true
      };
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
          message: 'Failed to process supplier tax information',
          success: false
        };
      }
    }

    return result;
  }

  private async updateSupplierTaxInfo(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    let result: IfsTableSynchronizationResult;

    try {
      await supplierDocumentTaxOps.update({
        supplier_id: data.supplier_id || '',
        vat_id: data.vat_id || null,
        tax_id: data.tax_id || null,
        rowkey: data.rowkey || null
      }, organizationId);

      result = {
        status: 200,
        message: 'Supplier tax information updated successfully',
        success: true
      };
    } catch (error: any) {
      result = {
        status: 500,
        message: 'Failed to update supplier tax information',
        success: false
      };
    }

    return result;
  }

  private async upsertSupplierTaxInfo(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    let result: IfsTableSynchronizationResult;

    try {
      await supplierDocumentTaxOps.upsert({
        supplier_id: data.supplier_id || '',
        vat_id: data.vat_id || null,
        tax_id: data.tax_id || null,
        rowkey: data.rowkey || null
      }, organizationId);

      result = {
        status: 200,
        message: 'Supplier tax information upsert successfully',
        success: true
      };
    } catch (error: any) {
      result = {
        status: 500,
        message: 'Failed to upsert supplier tax information',
        success: false
      };
    }

    return result;
  }

  private async deleteSupplierTaxInfo(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    let result: IfsTableSynchronizationResult;

    try {
      await supplierDocumentTaxOps.delete({
        supplier_id: data.supplier_id || '',
        vat_id: data.vat_id || null,
        tax_id: data.tax_id || null,
        rowkey: data.rowkey || null
      }, organizationId);

      result = {
        status: 200,
        message: 'Supplier tax information deleted successfully',
        success: true
      };
    } catch (error: any) {
      result = {
        status: 500,
        message: 'Failed to delete supplier tax information',
        success: false
      };
    }

    return result;
  }
}
