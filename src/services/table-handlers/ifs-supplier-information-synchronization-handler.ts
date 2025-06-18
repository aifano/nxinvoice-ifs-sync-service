import { PrismaClient } from '@prisma/client';
import { IfsTableSynchronizationHandler } from '../../types/ifs-table-handler';
import { IfsTableSynchronizationAction, IfsTableSynchronizationResult, IfsSupplierInformationData } from '../../types/ifs-table-synchronization';
import { IfsTableSynchronizationResponseMessage, IfsTableSynchronizationErrorType } from '../../types/ifs-table-synchronization-response-messages';

export class IfsSupplierInformationSynchronizationHandler implements IfsTableSynchronizationHandler {
  
  constructor(private prismaClientForDatabaseOperations: PrismaClient) {}

  async handleTableSynchronization(
    synchronizationAction: IfsTableSynchronizationAction,
    organizationId: string,
    ifsSupplierInformationData: IfsSupplierInformationData
  ): Promise<IfsTableSynchronizationResult> {
    switch (synchronizationAction) {
      case 'insert':
        return this.insertNewSupplierInformationRecord(organizationId, ifsSupplierInformationData);
      case 'update':
        return this.updateExistingSupplierInformationRecord(organizationId, ifsSupplierInformationData);
      case 'upsert':
        return this.upsertSupplierInformationRecord(organizationId, ifsSupplierInformationData);
      case 'delete':
        return this.deleteSupplierInformationRecord(organizationId, ifsSupplierInformationData);
      default:
        throw new Error(`Unsupported synchronization action: ${synchronizationAction}`);
    }
  }

  getIfsTableName(): string {
    return 'supplier_info_tab';
  }

  getTargetDatabaseTableName(): string {
    return 'suppliers';
  }

  getSupportedSynchronizationActions(): IfsTableSynchronizationAction[] {
    return ['insert', 'update', 'upsert', 'delete'];
  }

  private async insertNewSupplierInformationRecord(
    organizationId: string,
    supplierInformationData: IfsSupplierInformationData
  ): Promise<IfsTableSynchronizationResult> {
    await this.prismaClientForDatabaseOperations.supplier.create({
      data: {
        supplier_id: supplierInformationData.supplier_id!!,
        name: supplierInformationData.name!!,
        organization_group_id: organizationId,
        external_id: supplierInformationData.rowkey,
      },
    });
    return {
      status: 200,
      message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_CREATED,
      success: true
    };
  }

  private async updateExistingSupplierInformationRecord(
    organizationId: string,
    supplierInformationData: IfsSupplierInformationData
  ): Promise<IfsTableSynchronizationResult> {
    const updateResult = await this.prismaClientForDatabaseOperations.supplier.updateMany({
      where: {
        organization_group_id: organizationId,
        external_id: supplierInformationData.rowkey,
      },
      data: {
        supplier_id: supplierInformationData.supplier_id!!,
        name: supplierInformationData.name!!,
      },
    });
    
    if (updateResult.count === 0) {
      return {
        status: 200,
        message: IfsTableSynchronizationResponseMessage.RECORD_NOT_FOUND,
        success: false,
        error_type: IfsTableSynchronizationErrorType.RECORD_NOT_FOUND
      };
    }
    
    return {
      status: 200,
      message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_UPDATED,
      success: true
    };
  }

  private async upsertSupplierInformationRecord(
    organizationId: string,
    supplierInformationData: IfsSupplierInformationData
  ): Promise<IfsTableSynchronizationResult> {
    const createManyResult = await this.prismaClientForDatabaseOperations.supplier.createMany({
      data: {
        supplier_id: supplierInformationData.supplier_id!!,
        name: supplierInformationData.name!!,
        organization_group_id: organizationId,
        external_id: supplierInformationData.rowkey,
      },
      skipDuplicates: true,
    });

    if (createManyResult.count === 0) {
      await this.updateExistingSupplierInformationRecord(organizationId, supplierInformationData);
      return { status: 200, message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_UPDATED_VIA_UPSERT, success: true };
    }
    return { status: 200, message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_CREATED_VIA_UPSERT, success: true };
  }

  private async deleteSupplierInformationRecord(
    organizationId: string,
    supplierInformationData: IfsSupplierInformationData
  ): Promise<IfsTableSynchronizationResult> {
    const deleteResult = await this.prismaClientForDatabaseOperations.supplier.deleteMany({
      where: {
        organization_group_id: organizationId,
        external_id: supplierInformationData.rowkey,
      },
    });
    
    if (deleteResult.count === 0) {
      return {
        status: 200,
        message: IfsTableSynchronizationResponseMessage.RECORD_NOT_FOUND,
        success: false,
        error_type: 'record_not_found'
      };
    }
    
    return {
      status: 200,
      message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_DELETED,
      success: true
    };
  }
}