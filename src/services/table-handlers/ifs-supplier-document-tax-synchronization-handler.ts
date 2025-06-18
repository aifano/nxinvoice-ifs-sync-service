import { PrismaClient } from '@prisma/client';
import { IfsTableSynchronizationHandler } from '../../types/ifs-table-handler';
import { IfsTableSynchronizationAction, IfsTableSynchronizationResult, IfsSupplierDocumentTaxInformationData } from '../../types/ifs-table-synchronization';
import { IfsTableSynchronizationResponseMessage, IfsTableSynchronizationErrorType } from '../../types/ifs-table-synchronization-response-messages';

export class IfsSupplierDocumentTaxSynchronizationHandler implements IfsTableSynchronizationHandler {
  
  constructor(private prismaClientForDatabaseOperations: PrismaClient) {}

  async handleTableSynchronization(
    synchronizationAction: IfsTableSynchronizationAction,
    organizationId: string,
    ifsSupplierTaxData: IfsSupplierDocumentTaxInformationData
  ): Promise<IfsTableSynchronizationResult> {
    switch (synchronizationAction) {
      case 'insert':
      case 'update':
      case 'upsert':
        return this.updateSupplierWithTaxInformation(organizationId, ifsSupplierTaxData);
      case 'delete':
        return this.handleTaxInformationDeletionRequest(organizationId, ifsSupplierTaxData);
      default:
        throw new Error(`Unsupported synchronization action: ${synchronizationAction}`);
    }
  }

  getIfsTableName(): string {
    return 'supplier_document_tax_info_tab';
  }

  getTargetDatabaseTableName(): string {
    return 'suppliers';
  }

  getSupportedSynchronizationActions(): IfsTableSynchronizationAction[] {
    return ['insert', 'update', 'upsert'];
  }

  private async updateSupplierWithTaxInformation(
    organizationId: string,
    supplierTaxInformationData: IfsSupplierDocumentTaxInformationData
  ): Promise<IfsTableSynchronizationResult> {
    const updateResult = await this.prismaClientForDatabaseOperations.supplier.updateMany({
      where: {
        organization_group_id: organizationId,
        external_id: supplierTaxInformationData.rowkey,
      },
      data: {
        vat_id: supplierTaxInformationData.vat_no,
        company_id: supplierTaxInformationData.company,
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
      message: IfsTableSynchronizationResponseMessage.SUPPLIER_TAX_INFORMATION_UPDATED,
      success: true
    };
  }

  private async handleTaxInformationDeletionRequest(
    organizationId: string,
    supplierTaxInformationData: IfsSupplierDocumentTaxInformationData
  ): Promise<IfsTableSynchronizationResult> {
    // Tax information deletion is not supported as it would remove critical supplier data
    return {
      status: 200,
      message: IfsTableSynchronizationResponseMessage.SUPPLIER_TAX_INFORMATION_DELETION_SKIPPED,
      success: true
    };
  }
}