import { IfsSupplierInformationSynchronizationHandler } from '../../../../src/services/table-handlers/ifs-supplier-information-synchronization-handler';
import { createMockPrismaClient, MockPrismaClient } from '../../../mocks/mock-prisma-client';
import { VALID_SUPPLIER_DATA, TEST_ORGANIZATION_ID, INVALID_DATA_MISSING_REQUIRED_FIELDS } from '../../../fixtures/test-data';
import { IfsTableSynchronizationResponseMessage, IfsTableSynchronizationErrorType } from '../../../../src/types/ifs-table-synchronization-response-messages';

describe('IfsSupplierInformationSynchronizationHandler', () => {
  let handler: IfsSupplierInformationSynchronizationHandler;
  let mockPrismaClient: MockPrismaClient;

  beforeEach(() => {
    mockPrismaClient = createMockPrismaClient();
    handler = new IfsSupplierInformationSynchronizationHandler(mockPrismaClient as any);
  });

  describe('getIfsTableName', () => {
    it('should return correct IFS table name', () => {
      expect(handler.getIfsTableName()).toBe('supplier_info_tab');
    });
  });

  describe('getTargetDatabaseTableName', () => {
    it('should return correct target database table name', () => {
      expect(handler.getTargetDatabaseTableName()).toBe('suppliers');
    });
  });

  describe('getSupportedSynchronizationActions', () => {
    it('should return all supported synchronization actions', () => {
      const actions = handler.getSupportedSynchronizationActions();
      expect(actions).toEqual(['insert', 'update', 'upsert', 'delete']);
      expect(actions).toHaveLength(4);
    });
  });

  describe('handleTableSynchronization - insert action', () => {
    it('should successfully insert new supplier information record', async () => {
      mockPrismaClient.supplier.create.mockResolvedValue({
        id: 'generated_id_123',
        supplier_id: VALID_SUPPLIER_DATA.supplier_id,
        name: VALID_SUPPLIER_DATA.name,
      });

      const result = await handler.handleTableSynchronization(
        'insert',
        TEST_ORGANIZATION_ID,
        VALID_SUPPLIER_DATA
      );

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_CREATED,
        success: true
      });

      expect(mockPrismaClient.supplier.create).toHaveBeenCalledWith({
        data: {
          supplier_id: VALID_SUPPLIER_DATA.supplier_id,
          name: VALID_SUPPLIER_DATA.name,
          organization_group_id: TEST_ORGANIZATION_ID,
          external_id: VALID_SUPPLIER_DATA.rowkey,
        },
      });
    });

    it('should handle insert with missing required fields', async () => {
      mockPrismaClient.supplier.create.mockRejectedValue(
        new Error('Required field validation failed')
      );

      await expect(
        handler.handleTableSynchronization(
          'insert',
          TEST_ORGANIZATION_ID,
          INVALID_DATA_MISSING_REQUIRED_FIELDS
        )
      ).rejects.toThrow('Required field validation failed');

      expect(mockPrismaClient.supplier.create).toHaveBeenCalled();
    });
  });

  describe('handleTableSynchronization - update action', () => {
    it('should successfully update existing supplier information record', async () => {
      mockPrismaClient.supplier.updateMany.mockResolvedValue({ count: 1 });

      const result = await handler.handleTableSynchronization(
        'update',
        TEST_ORGANIZATION_ID,
        VALID_SUPPLIER_DATA
      );

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_UPDATED,
        success: true
      });

      expect(mockPrismaClient.supplier.updateMany).toHaveBeenCalledWith({
        where: {
          organization_group_id: TEST_ORGANIZATION_ID,
          external_id: VALID_SUPPLIER_DATA.rowkey,
        },
        data: {
          supplier_id: VALID_SUPPLIER_DATA.supplier_id,
          name: VALID_SUPPLIER_DATA.name,
        },
      });
    });

    it('should handle update when no records match criteria', async () => {
      mockPrismaClient.supplier.updateMany.mockResolvedValue({ count: 0 });

      const result = await handler.handleTableSynchronization(
        'update',
        TEST_ORGANIZATION_ID,
        VALID_SUPPLIER_DATA
      );

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_UPDATED,
        success: true
      });
    });
  });

  describe('handleTableSynchronization - upsert action', () => {
    it('should insert new record when createMany succeeds', async () => {
      mockPrismaClient.supplier.createMany.mockResolvedValue({ count: 1 });

      const result = await handler.handleTableSynchronization(
        'upsert',
        TEST_ORGANIZATION_ID,
        VALID_SUPPLIER_DATA
      );

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_CREATED_VIA_UPSERT,
        success: true
      });

      expect(mockPrismaClient.supplier.createMany).toHaveBeenCalledWith({
        data: {
          supplier_id: VALID_SUPPLIER_DATA.supplier_id,
          name: VALID_SUPPLIER_DATA.name,
          organization_group_id: TEST_ORGANIZATION_ID,
          external_id: VALID_SUPPLIER_DATA.rowkey,
        },
        skipDuplicates: true,
      });
    });

    it('should update existing record when createMany returns count 0', async () => {
      mockPrismaClient.supplier.createMany.mockResolvedValue({ count: 0 });
      mockPrismaClient.supplier.updateMany.mockResolvedValue({ count: 1 });

      const result = await handler.handleTableSynchronization(
        'upsert',
        TEST_ORGANIZATION_ID,
        VALID_SUPPLIER_DATA
      );

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_UPDATED_VIA_UPSERT,
        success: true
      });

      expect(mockPrismaClient.supplier.createMany).toHaveBeenCalled();
      expect(mockPrismaClient.supplier.updateMany).toHaveBeenCalled();
    });
  });

  describe('handleTableSynchronization - update action - record not found', () => {
    it('should return record not found when update affects no rows', async () => {
      mockPrismaClient.supplier.updateMany.mockResolvedValue({ count: 0 });

      const result = await handler.handleTableSynchronization(
        'update',
        TEST_ORGANIZATION_ID,
        VALID_SUPPLIER_DATA
      );

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.RECORD_NOT_FOUND,
        success: false,
        error_type: IfsTableSynchronizationErrorType.RECORD_NOT_FOUND
      });
    });
  });

  describe('handleTableSynchronization - delete action', () => {
    it('should successfully delete supplier information record', async () => {
      mockPrismaClient.supplier.deleteMany.mockResolvedValue({ count: 1 });

      const result = await handler.handleTableSynchronization(
        'delete',
        TEST_ORGANIZATION_ID,
        VALID_SUPPLIER_DATA
      );

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_DELETED,
        success: true
      });

      expect(mockPrismaClient.supplier.deleteMany).toHaveBeenCalledWith({
        where: {
          organization_group_id: TEST_ORGANIZATION_ID,
          external_id: VALID_SUPPLIER_DATA.rowkey,
        },
      });
    });

    it('should handle delete when no records match criteria', async () => {
      mockPrismaClient.supplier.deleteMany.mockResolvedValue({ count: 0 });

      const result = await handler.handleTableSynchronization(
        'delete',
        TEST_ORGANIZATION_ID,
        VALID_SUPPLIER_DATA
      );

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_DELETED,
        success: true
      });
    });
  });

  describe('handleTableSynchronization - unsupported action', () => {
    it('should throw error for unsupported synchronization action', async () => {
      await expect(
        handler.handleTableSynchronization(
          'unsupported_action' as any,
          TEST_ORGANIZATION_ID,
          VALID_SUPPLIER_DATA
        )
      ).rejects.toThrow('Unsupported synchronization action: unsupported_action');
    });
  });

  describe('error handling', () => {
    it('should propagate database errors during insert', async () => {
      const databaseError = new Error('Database connection failed');
      mockPrismaClient.supplier.create.mockRejectedValue(databaseError);

      await expect(
        handler.handleTableSynchronization(
          'insert',
          TEST_ORGANIZATION_ID,
          VALID_SUPPLIER_DATA
        )
      ).rejects.toThrow('Database connection failed');
    });

    it('should propagate database errors during update', async () => {
      const databaseError = new Error('Update operation failed');
      mockPrismaClient.supplier.updateMany.mockRejectedValue(databaseError);

      await expect(
        handler.handleTableSynchronization(
          'update',
          TEST_ORGANIZATION_ID,
          VALID_SUPPLIER_DATA
        )
      ).rejects.toThrow('Update operation failed');
    });

    it('should propagate database errors during upsert createMany', async () => {
      const databaseError = new Error('CreateMany operation failed');
      mockPrismaClient.supplier.createMany.mockRejectedValue(databaseError);

      await expect(
        handler.handleTableSynchronization(
          'upsert',
          TEST_ORGANIZATION_ID,
          VALID_SUPPLIER_DATA
        )
      ).rejects.toThrow('CreateMany operation failed');
    });

    it('should propagate database errors during delete', async () => {
      const databaseError = new Error('Delete operation failed');
      mockPrismaClient.supplier.deleteMany.mockRejectedValue(databaseError);

      await expect(
        handler.handleTableSynchronization(
          'delete',
          TEST_ORGANIZATION_ID,
          VALID_SUPPLIER_DATA
        )
      ).rejects.toThrow('Delete operation failed');
    });
  });
});