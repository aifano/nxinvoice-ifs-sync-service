import { PrismaClient } from '@prisma/client';
import { IfsResponse } from '../../../common/interfaces/ifs.interface';

export class IfsSyncService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  async processData(table: string, action: string, data: any, organizationId: string): Promise<IfsResponse & { previousData?: any }> {
    try {
      // Validate rowkey is present for all operations
      if (!data?.rowkey || typeof data.rowkey !== 'string' || data.rowkey.trim() === '') {
        return {
          message: 'Missing required field: rowkey',
          success: false
        };
      }

      // Read existing data before performing any operation
      const previousData = await this.readExistingData(table, organizationId, data.rowkey);

      if (action === 'delete') {
        const result = await this.deleteRecord(table, data, organizationId);
        return { ...result, previousData };
      } else if (action === 'upsert' || action === 'insert' || action === 'update') {
        // All other actions (upsert, insert, update) use upsert logic
        const result = await this.upsertRecord(table, data, organizationId);
        return { ...result, previousData };
      } else {
        return {
          message: 'Unsupported action',
          success: false
        };
      }
    } catch (error) {
      // Log the real error for debugging
      console.error('Database operation failed:', error);

      return {
        message: 'Database operation failed',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async upsertRecord(table: string, data: any, organizationId: string): Promise<IfsResponse> {
    // First normalize all keys to lowercase
    let recordData = this.normalizeKeys({
      ...data,
      organization_id: organizationId,
      updated_at: new Date()
    });

    try {
      switch (table) {
        case 'supplier_info_tab':
          recordData = this.filterValidFields(recordData, 'supplier');
          return await this.performUpsert((this.prisma as any).iFS_Supplier, recordData, organizationId, data.rowkey);
        case 'payment_address_tab':
          recordData = this.mapPaymentFields(recordData);
          recordData = this.filterValidFields(recordData, 'payment');
          return await this.performUpsert((this.prisma as any).iFS_Payment_Address, recordData, organizationId, data.rowkey);
        case 'supplier_document_tax_info_tab':
          recordData = this.filterValidFields(recordData, 'tax');
          return await this.performUpsert((this.prisma as any).iFS_Supplier_Document_Tax, recordData, organizationId, data.rowkey);
        default:
          throw new Error(`Unsupported table: ${table}`);
      }
    } catch (error) {
      throw error;
    }
  }

  private async deleteRecord(table: string, data: any, organizationId: string): Promise<IfsResponse> {
    const prismaTables: Record<string, any> = {
      'supplier_info_tab': (this.prisma as any).iFS_Supplier,
      'payment_address_tab': (this.prisma as any).iFS_Payment_Address,
      'supplier_document_tax_info_tab': (this.prisma as any).iFS_Supplier_Document_Tax
    };
    try {

      const prismaTable = prismaTables[table];
      if (!prismaTable) {
        throw new Error(`Unsupported table: ${table}`);
      }
      return await this.performDelete(prismaTable, organizationId, data.rowkey);
    } catch (error) {
      throw error;
    }
  }

  private async performUpsert(model: any, recordData: any, organizationId: string, rowkey: string): Promise<IfsResponse> {
    // Try create first
    const createResult = await model.createMany({
      data: recordData,
      skipDuplicates: true
    });

    if (createResult.count > 0) {
      return { message: 'Record created successfully', success: true };
    }

    // If not created, try to update existing
    const updateResult = await model.updateMany({
      where: {
        organization_id: organizationId,
        rowkey: rowkey
      },
      data: recordData
    });

    if (updateResult.count > 0) {
      return { message: 'Record updated successfully', success: true };
    } else {
      return { message: 'Record not found for update', success: true };
    }
  }

  private async performDelete(model: any, organizationId: string, rowkey: string): Promise<IfsResponse> {
    const deleteResult = await model.deleteMany({
      where: {
        organization_id: organizationId,
        rowkey: rowkey
      }
    });

    if (deleteResult.count > 0) {
      return {
        message: `Record deleted successfully`,
        success: true
      };
    } else {
      return {
        message: `Record not found or already deleted`,
        success: false
      };
    }
  }

  // Normalize all object keys to lowercase
  private normalizeKeys(data: any): any {
    if (data === null || data === undefined || typeof data !== 'object') {
      return data;
    }

    if (data instanceof Date) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.normalizeKeys(item));
    }

    const normalizedData: any = {};
    for (const [key, value] of Object.entries(data)) {
      const normalizedKey = key.toLowerCase();
      normalizedData[normalizedKey] = typeof value === 'object' ? this.normalizeKeys(value) : value;
    }

    return normalizedData;
  }

  // Field mapping for payment_address_tab
  private mapPaymentFields(data: any): any {
    const mappedData = { ...data };

    // Map back to original field names
    if (mappedData.supplier_name !== undefined) {
      mappedData.data10 = mappedData.supplier_name;
      delete mappedData.supplier_name;
    }

    if (mappedData.bank_name !== undefined) {
      mappedData.description = mappedData.bank_name;
      delete mappedData.bank_name;
    }

    return mappedData;
  }

  // Filter only valid fields for each table using Prisma model introspection
  private filterValidFields(data: any, tableType: 'supplier' | 'payment' | 'tax'): any {
    const validFields = this.getValidFieldsFromPrisma(tableType);
    const filteredData: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (validFields.includes(key)) {
        filteredData[key] = value;
      } else {
        console.warn(`Ignoring unknown field '${key}' for table type '${tableType}'`);
      }
    }

    return filteredData;
  }

  // Read existing data before performing operations
  private async readExistingData(table: string, organizationId: string, rowkey: string): Promise<any> {
    try {
      const prismaTables: Record<string, any> = {
        'supplier_info_tab': (this.prisma as any).iFS_Supplier,
        'payment_address_tab': (this.prisma as any).iFS_Payment_Address,
        'supplier_document_tax_info_tab': (this.prisma as any).iFS_Supplier_Document_Tax
      };

      const prismaTable = prismaTables[table];
      if (!prismaTable) {
        console.warn(`Unknown table for reading existing data: ${table}`);
        return null;
      }

      const existingRecord = await prismaTable.findFirst({
        where: {
          organization_id: organizationId,
          rowkey: rowkey
        }
      });

      return existingRecord;
    } catch (error) {
      console.error(`Failed to read existing data for ${table}/${rowkey}:`, error);
      return null;
    }
  }

  // Get valid fields directly from Prisma models
  private getValidFieldsFromPrisma(tableType: 'supplier' | 'payment' | 'tax'): string[] {
    const prismaTables = {
      'supplier': (this.prisma as any).iFS_Supplier,
      'payment': (this.prisma as any).iFS_Payment_Address,
      'tax': (this.prisma as any).iFS_Supplier_Document_Tax
    };
    return prismaTables[tableType] && (prismaTables[tableType] as any).fields ? Object.keys((prismaTables[tableType] as any).fields || {}) : [];
  }
}
