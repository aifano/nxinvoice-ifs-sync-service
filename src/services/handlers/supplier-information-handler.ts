import { IfsTableHandler } from '../../types/ifs-table-handler';
import { IfsTableSynchronizationResult } from '../../types/ifs-table-synchronization';
import { supplierOps } from '../repositories/supplier-repository';

export class SupplierInformationHandler implements IfsTableHandler {

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
    let result: IfsTableSynchronizationResult;

    try {
      await supplierOps.insert({
        supplier_id: data.supplier_id || '',
        name: data.name || '',
        rowkey: data.rowkey || null,
      }, organizationId);

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

    return result;
  }

  private async updateSupplier(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    let result: IfsTableSynchronizationResult;

    try {
      await supplierOps.update({
        supplier_id: data.supplier_id || '',
        name: data.name || '',
        rowkey: data.rowkey,
      }, organizationId);

      result = {
        status: 200,
        message: 'Supplier updated successfully',
        success: true
      };
    } catch (error: any) {
      if (error.message === 'Supplier not found') {
        result = {
          status: 404,
          message: 'Supplier not found',
          success: false
        };
      } else {
        result = {
          status: 500,
          message: 'Failed to update supplier',
          success: false
        };
      }
    }

    return result;
  }

  private async upsertSupplier(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    let result: IfsTableSynchronizationResult;

    try {
      await supplierOps.upsert({
        supplier_id: data.supplier_id || '',
        name: data.name || '',
        rowkey: data.rowkey,
      }, organizationId);

      result = {
        status: 200,
        message: 'Supplier upserted successfully',
        success: true
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        result = {
          status: 409,
          message: 'Supplier already exists',
          success: false
        };
      } else {
        result = {
          status: 500,
          message: 'Failed to upsert supplier',
          success: false
        };
      }
    }

    return result;
  }

  private async deleteSupplier(organizationId: string, data: any): Promise<IfsTableSynchronizationResult> {
    let result: IfsTableSynchronizationResult;

    try {
      await supplierOps.delete({
        supplier_id: data.supplier_id || '',
        name: data.name || '',
        rowkey: data.rowkey,
      }, organizationId);

      result = {
        status: 200,
        message: 'Supplier deleted successfully',
        success: true
      };
    } catch (error: any) {
      if (error.message === 'Supplier not found') {
        result = {
          status: 404,
          message: 'Supplier not found',
          success: false
        };
      } else {
        result = {
          status: 500,
          message: 'Failed to delete supplier',
          success: false
        };
      }
    }

    return result;
  }
}
