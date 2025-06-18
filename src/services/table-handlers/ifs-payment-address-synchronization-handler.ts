import { PrismaClient } from '@prisma/client';
import { IfsTableSynchronizationHandler } from '../../types/ifs-table-handler';
import { IfsTableSynchronizationAction, IfsTableSynchronizationResult, IfsPaymentAddressInformationData } from '../../types/ifs-table-synchronization';
import { IfsTableSynchronizationResponseMessage, IfsTableSynchronizationErrorType } from '../../types/ifs-table-synchronization-response-messages';

export class IfsPaymentAddressSynchronizationHandler implements IfsTableSynchronizationHandler {
  
  constructor(private prismaClientForDatabaseOperations: PrismaClient) {}

  async handleTableSynchronization(
    synchronizationAction: IfsTableSynchronizationAction,
    organizationId: string,
    ifsPaymentAddressData: IfsPaymentAddressInformationData
  ): Promise<IfsTableSynchronizationResult> {
    switch (synchronizationAction) {
      case 'insert':
        return this.insertNewPaymentAddressRecord(organizationId, ifsPaymentAddressData);
      case 'update':
        return this.updateExistingPaymentAddressRecord(organizationId, ifsPaymentAddressData);
      case 'upsert':
        return this.upsertPaymentAddressRecord(organizationId, ifsPaymentAddressData);
      case 'delete':
        return this.deletePaymentAddressRecord(organizationId, ifsPaymentAddressData);
      default:
        throw new Error(`Unsupported synchronization action: ${synchronizationAction}`);
    }
  }

  getIfsTableName(): string {
    return 'payment_address_tab';
  }

  getTargetDatabaseTableName(): string {
    return 'supplier_bank_addresses';
  }

  getSupportedSynchronizationActions(): IfsTableSynchronizationAction[] {
    return ['insert', 'update', 'upsert', 'delete'];
  }

  private buildPaymentAddressDataForDatabase(
    organizationId: string,
    paymentAddressData: IfsPaymentAddressInformationData
  ) {
    return {
      tenant_id: paymentAddressData.company!!,
      supplier_id: paymentAddressData.identity!!,
      bank_name: paymentAddressData.data2,
      bic: paymentAddressData.bic_code,
      is_default: paymentAddressData.default_address === 'TRUE',
      blocked_for_use: paymentAddressData.blocked_for_use === 'TRUE',
      way_id: paymentAddressData.way_id,
      address_id: paymentAddressData.address_id,
      organization_id: organizationId,
      external_id: paymentAddressData.rowkey,
    };
  }

  private async insertNewPaymentAddressRecord(
    organizationId: string,
    paymentAddressData: IfsPaymentAddressInformationData
  ): Promise<IfsTableSynchronizationResult> {
    const databasePaymentAddressData = this.buildPaymentAddressDataForDatabase(organizationId, paymentAddressData);
    
    await this.prismaClientForDatabaseOperations.supplierBankAddresses.create({ 
      data: databasePaymentAddressData 
    });
    return {
      status: 200,
      message: IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_CREATED,
      success: true
    };
  }

  private async updateExistingPaymentAddressRecord(
    organizationId: string,
    paymentAddressData: IfsPaymentAddressInformationData
  ): Promise<IfsTableSynchronizationResult> {
    const databasePaymentAddressData = this.buildPaymentAddressDataForDatabase(organizationId, paymentAddressData);

    const updateResult = await this.prismaClientForDatabaseOperations.supplierBankAddresses.updateMany({
      where: {
        external_id: paymentAddressData.rowkey,
        organization_id: organizationId,
      },
      data: databasePaymentAddressData,
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
      message: IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_UPDATED,
      success: true
    };
  }

  private async upsertPaymentAddressRecord(
    organizationId: string,
    paymentAddressData: IfsPaymentAddressInformationData
  ): Promise<IfsTableSynchronizationResult> {
    const databasePaymentAddressData = this.buildPaymentAddressDataForDatabase(organizationId, paymentAddressData);

    const createManyResult = await this.prismaClientForDatabaseOperations.supplierBankAddresses.createMany({
      data: databasePaymentAddressData,
      skipDuplicates: true,
    });

    if (createManyResult.count === 0) {
      const updateResult = await this.updateExistingPaymentAddressRecord(organizationId, paymentAddressData);
      return {
        status: updateResult.status,
        message: updateResult.success ? IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_UPDATED_VIA_UPSERT : updateResult.message,
        success: updateResult.success,
        error_type: updateResult.error_type
      };
    }
    return {
      status: 200,
      message: IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_CREATED_VIA_UPSERT,
      success: true
    };
  }

  private async deletePaymentAddressRecord(
    organizationId: string,
    paymentAddressData: IfsPaymentAddressInformationData
  ): Promise<IfsTableSynchronizationResult> {
    const deleteResult = await this.prismaClientForDatabaseOperations.supplierBankAddresses.deleteMany({
      where: {
        external_id: paymentAddressData.rowkey,
        organization_id: organizationId,
      },
    });
    
    if (deleteResult.count === 0) {
      return {
        status: 200,
        message: IfsTableSynchronizationResponseMessage.RECORD_NOT_FOUND,
        success: false,
        error_type: IfsTableSynchronizationErrorType.RECORD_NOT_FOUND
      };
    }
    
    return {
      status: 200,
      message: IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_DELETED,
      success: true
    };
  }
}