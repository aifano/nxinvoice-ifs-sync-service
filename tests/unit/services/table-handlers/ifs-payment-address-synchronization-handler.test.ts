import { IfsPaymentAddressSynchronizationHandler } from '../../../../src/services/table-handlers/ifs-payment-address-synchronization-handler';
import { createMockPrismaClient, MockPrismaClient } from '../../../mocks/mock-prisma-client';
import { VALID_PAYMENT_ADDRESS_DATA, TEST_ORGANIZATION_ID } from '../../../fixtures/test-data';
import { IfsTableSynchronizationResponseMessage } from '../../../../src/types/ifs-table-synchronization-response-messages';

describe('IfsPaymentAddressSynchronizationHandler', () => {
  let handler: IfsPaymentAddressSynchronizationHandler;
  let mockPrismaClient: MockPrismaClient;

  beforeEach(() => {
    mockPrismaClient = createMockPrismaClient();
    handler = new IfsPaymentAddressSynchronizationHandler(mockPrismaClient as any);
  });

  describe('handler metadata', () => {
    it('should return correct IFS table name', () => {
      expect(handler.getIfsTableName()).toBe('payment_address_tab');
    });

    it('should return correct target database table name', () => {
      expect(handler.getTargetDatabaseTableName()).toBe('supplier_bank_addresses');
    });

    it('should return all supported synchronization actions', () => {
      const actions = handler.getSupportedSynchronizationActions();
      expect(actions).toEqual(['insert', 'update', 'upsert', 'delete']);
    });
  });

  describe('handleTableSynchronization - insert action', () => {
    it('should successfully insert new payment address record with all fields', async () => {
      mockPrismaClient.supplierBankAddresses.create.mockResolvedValue({
        id: 'generated_payment_address_id',
      });

      const result = await handler.handleTableSynchronization(
        'insert',
        TEST_ORGANIZATION_ID,
        VALID_PAYMENT_ADDRESS_DATA
      );

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_CREATED,
        success: true
      });

      expect(mockPrismaClient.supplierBankAddresses.create).toHaveBeenCalledWith({
        data: {
          tenant_id: VALID_PAYMENT_ADDRESS_DATA.company,
          supplier_id: VALID_PAYMENT_ADDRESS_DATA.identity,
          bank_name: VALID_PAYMENT_ADDRESS_DATA.data2,
          bic: VALID_PAYMENT_ADDRESS_DATA.bic_code,
          is_default: true, // 'TRUE' converted to boolean
          blocked_for_use: false, // 'FALSE' converted to boolean
          way_id: VALID_PAYMENT_ADDRESS_DATA.way_id,
          address_id: VALID_PAYMENT_ADDRESS_DATA.address_id,
          organization_id: TEST_ORGANIZATION_ID,
          external_id: VALID_PAYMENT_ADDRESS_DATA.rowkey,
        },
      });
    });

    it('should correctly convert string boolean values', async () => {
      const testData = {
        ...VALID_PAYMENT_ADDRESS_DATA,
        default_address: 'FALSE',
        blocked_for_use: 'TRUE',
      };

      await handler.handleTableSynchronization('insert', TEST_ORGANIZATION_ID, testData);

      const createCall = mockPrismaClient.supplierBankAddresses.create.mock.calls[0][0];
      expect(createCall.data.is_default).toBe(false);
      expect(createCall.data.blocked_for_use).toBe(true);
    });
  });

  describe('handleTableSynchronization - update action', () => {
    it('should successfully update existing payment address record', async () => {
      mockPrismaClient.supplierBankAddresses.updateMany.mockResolvedValue({ count: 1 });

      const result = await handler.handleTableSynchronization(
        'update',
        TEST_ORGANIZATION_ID,
        VALID_PAYMENT_ADDRESS_DATA
      );

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_UPDATED,
        success: true
      });

      expect(mockPrismaClient.supplierBankAddresses.updateMany).toHaveBeenCalledWith({
        where: {
          external_id: VALID_PAYMENT_ADDRESS_DATA.rowkey,
          organization_id: TEST_ORGANIZATION_ID,
        },
        data: {
          tenant_id: VALID_PAYMENT_ADDRESS_DATA.company,
          supplier_id: VALID_PAYMENT_ADDRESS_DATA.identity,
          bank_name: VALID_PAYMENT_ADDRESS_DATA.data2,
          bic: VALID_PAYMENT_ADDRESS_DATA.bic_code,
          is_default: true,
          blocked_for_use: false,
          way_id: VALID_PAYMENT_ADDRESS_DATA.way_id,
          address_id: VALID_PAYMENT_ADDRESS_DATA.address_id,
          organization_id: TEST_ORGANIZATION_ID,
          external_id: VALID_PAYMENT_ADDRESS_DATA.rowkey,
        },
      });
    });
  });

  describe('handleTableSynchronization - upsert action', () => {
    it('should insert when record does not exist (createMany count > 0)', async () => {
      mockPrismaClient.supplierBankAddresses.createMany.mockResolvedValue({ count: 1 });

      const result = await handler.handleTableSynchronization(
        'upsert',
        TEST_ORGANIZATION_ID,
        VALID_PAYMENT_ADDRESS_DATA
      );

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_CREATED_VIA_UPSERT,
        success: true
      });

      expect(mockPrismaClient.supplierBankAddresses.createMany).toHaveBeenCalledWith({
        data: expect.objectContaining({
          external_id: VALID_PAYMENT_ADDRESS_DATA.rowkey,
          organization_id: TEST_ORGANIZATION_ID,
        }),
        skipDuplicates: true,
      });
    });

    it('should update when record exists (createMany count = 0)', async () => {
      mockPrismaClient.supplierBankAddresses.createMany.mockResolvedValue({ count: 0 });
      mockPrismaClient.supplierBankAddresses.updateMany.mockResolvedValue({ count: 1 });

      const result = await handler.handleTableSynchronization(
        'upsert',
        TEST_ORGANIZATION_ID,
        VALID_PAYMENT_ADDRESS_DATA
      );

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_UPDATED_VIA_UPSERT,
        success: true
      });

      expect(mockPrismaClient.supplierBankAddresses.createMany).toHaveBeenCalled();
      expect(mockPrismaClient.supplierBankAddresses.updateMany).toHaveBeenCalled();
    });
  });

  describe('handleTableSynchronization - delete action', () => {
    it('should successfully delete payment address record', async () => {
      mockPrismaClient.supplierBankAddresses.deleteMany.mockResolvedValue({ count: 1 });

      const result = await handler.handleTableSynchronization(
        'delete',
        TEST_ORGANIZATION_ID,
        VALID_PAYMENT_ADDRESS_DATA
      );

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_DELETED,
        success: true
      });

      expect(mockPrismaClient.supplierBankAddresses.deleteMany).toHaveBeenCalledWith({
        where: {
          external_id: VALID_PAYMENT_ADDRESS_DATA.rowkey,
          organization_id: TEST_ORGANIZATION_ID,
        },
      });
    });
  });

  describe('buildPaymentAddressDataForDatabase', () => {
    it('should correctly map all IFS fields to database fields', async () => {
      await handler.handleTableSynchronization(
        'insert',
        TEST_ORGANIZATION_ID,
        VALID_PAYMENT_ADDRESS_DATA
      );

      const createCall = mockPrismaClient.supplierBankAddresses.create.mock.calls[0][0];
      const mappedData = createCall.data;

      expect(mappedData).toEqual({
        tenant_id: VALID_PAYMENT_ADDRESS_DATA.company,
        supplier_id: VALID_PAYMENT_ADDRESS_DATA.identity,
        bank_name: VALID_PAYMENT_ADDRESS_DATA.data2,
        bic: VALID_PAYMENT_ADDRESS_DATA.bic_code,
        is_default: true,
        blocked_for_use: false,
        way_id: VALID_PAYMENT_ADDRESS_DATA.way_id,
        address_id: VALID_PAYMENT_ADDRESS_DATA.address_id,
        organization_id: TEST_ORGANIZATION_ID,
        external_id: VALID_PAYMENT_ADDRESS_DATA.rowkey,
      });
    });

    it('should handle undefined optional fields gracefully', async () => {
      const minimalData = {
        company: 'COMP001',
        identity: 'SUPPLIER001',
        rowkey: 'minimal_key_123',
        default_address: 'FALSE',
        blocked_for_use: 'FALSE',
      };

      await handler.handleTableSynchronization('insert', TEST_ORGANIZATION_ID, minimalData);

      const createCall = mockPrismaClient.supplierBankAddresses.create.mock.calls[0][0];
      const mappedData = createCall.data;

      expect(mappedData.bank_name).toBeUndefined();
      expect(mappedData.bic).toBeUndefined();
      expect(mappedData.way_id).toBeUndefined();
      expect(mappedData.address_id).toBeUndefined();
      expect(mappedData.is_default).toBe(false);
      expect(mappedData.blocked_for_use).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should propagate database errors', async () => {
      const databaseError = new Error('Database constraint violation');
      mockPrismaClient.supplierBankAddresses.create.mockRejectedValue(databaseError);

      await expect(
        handler.handleTableSynchronization(
          'insert',
          TEST_ORGANIZATION_ID,
          VALID_PAYMENT_ADDRESS_DATA
        )
      ).rejects.toThrow('Database constraint violation');
    });

    it('should throw error for unsupported action', async () => {
      await expect(
        handler.handleTableSynchronization(
          'invalid_action' as any,
          TEST_ORGANIZATION_ID,
          VALID_PAYMENT_ADDRESS_DATA
        )
      ).rejects.toThrow('Unsupported synchronization action: invalid_action');
    });
  });
});