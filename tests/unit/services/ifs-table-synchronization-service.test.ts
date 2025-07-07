import { IfsTableSynchronizationService } from '../../../src/services/ifs-table-synchronization-service';
import { OrganizationContextJsonLogger } from '../../../src/utilities/organization-context-json-logger';
import { IfsTableSqlAuditLogger } from '../../../src/utilities/ifs-table-sql-audit-logger';
import { createMockPrismaClient, MockPrismaClient } from '../../mocks/mock-prisma-client';
import { VALID_SUPPLIER_DATA, VALID_PAYMENT_ADDRESS_DATA, TEST_ORGANIZATION_ID } from '../../fixtures/test-data';
import { IfsTableSynchronizationResponseMessage } from '../../../src/types/ifs-table-synchronization-response-messages';

// Mock the file system operations
jest.mock('fs/promises', () => ({
  appendFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

describe('IfsTableSynchronizationService', () => {
  let service: IfsTableSynchronizationService;
  let mockPrismaClient: MockPrismaClient;
  let mockOrganizationContextLogger: jest.Mocked<OrganizationContextJsonLogger>;
  let mockSqlAuditLogger: jest.Mocked<IfsTableSqlAuditLogger>;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockPrismaClient = createMockPrismaClient();
    
    // Create mock loggers
    mockOrganizationContextLogger = {
      logInformationWithOrganizationContext: jest.fn(),
      logWarningWithOrganizationContext: jest.fn(),
      logErrorWithOrganizationContext: jest.fn(),
      logDebugInformationWithOrganizationContext: jest.fn(),
    } as any;

    mockSqlAuditLogger = {
      logIfsTableSqlOperationWithOrganizationContext: jest.fn().mockResolvedValue(undefined),
    } as any;

    service = new IfsTableSynchronizationService(
      mockPrismaClient as any,
      mockOrganizationContextLogger,
      mockSqlAuditLogger
    );
    
    // Mock console methods to avoid test output pollution
    consoleSpy = jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('getSupportedIfsTableNames', () => {
    it('should return all default supported IFS table names', () => {
      const supportedTables = service.getSupportedIfsTableNames();
      
      expect(supportedTables).toContain('supplier_info_tab');
      expect(supportedTables).toContain('payment_address_tab');
      expect(supportedTables).toContain('supplier_document_tax_info_tab');
      expect(supportedTables).toHaveLength(3);
    });
  });

  describe('getNumberOfSupportedIfsTableNames', () => {
    it('should return correct count of supported tables', () => {
      const count = service.getNumberOfSupportedIfsTableNames();
      expect(count).toBe(3);
    });
  });

  describe('synchronizeIfsTableData - supplier_info_tab', () => {
    it('should successfully synchronize supplier information with insert action', async () => {
      const request = {
        action: 'insert' as const,
        organization_id: TEST_ORGANIZATION_ID,
        data: VALID_SUPPLIER_DATA,
      };

      const result = await service.synchronizeIfsTableData('supplier_info_tab', request);

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

    it('should successfully synchronize supplier information with update action', async () => {
      const request = {
        action: 'update' as const,
        organization_id: TEST_ORGANIZATION_ID,
        data: VALID_SUPPLIER_DATA,
      };

      const result = await service.synchronizeIfsTableData('supplier_info_tab', request);

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_UPDATED,
        success: true
      });

      expect(mockPrismaClient.supplier.updateMany).toHaveBeenCalled();
    });

    it('should successfully synchronize supplier information with upsert action', async () => {
      mockPrismaClient.supplier.createMany.mockResolvedValue({ count: 1 });

      const request = {
        action: 'upsert' as const,
        organization_id: TEST_ORGANIZATION_ID,
        data: VALID_SUPPLIER_DATA,
      };

      const result = await service.synchronizeIfsTableData('supplier_info_tab', request);

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_CREATED_VIA_UPSERT,
        success: true
      });
    });

    it('should successfully synchronize supplier information with delete action', async () => {
      const request = {
        action: 'delete' as const,
        organization_id: TEST_ORGANIZATION_ID,
        data: VALID_SUPPLIER_DATA,
      };

      const result = await service.synchronizeIfsTableData('supplier_info_tab', request);

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_DELETED,
        success: true
      });

      expect(mockPrismaClient.supplier.deleteMany).toHaveBeenCalled();
    });
  });

  describe('synchronizeIfsTableData - payment_address_tab', () => {
    it('should successfully synchronize payment address with insert action', async () => {
      const request = {
        action: 'insert' as const,
        organization_id: TEST_ORGANIZATION_ID,
        data: VALID_PAYMENT_ADDRESS_DATA,
      };

      const result = await service.synchronizeIfsTableData('payment_address_tab', request);

      expect(result).toEqual({
        status: 200,
        message: IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_CREATED,
        success: true
      });

      expect(mockPrismaClient.supplierBankAddresse.create).toHaveBeenCalled();
    });
  });

  describe('synchronizeIfsTableData - validation', () => {
    it('should return error for unsupported IFS table name', async () => {
      const request = {
        action: 'insert' as const,
        organization_id: TEST_ORGANIZATION_ID,
        data: VALID_SUPPLIER_DATA,
      };

      const result = await service.synchronizeIfsTableData('unsupported_table', request);

      expect(result).toEqual({
        status: 400,
        message: IfsTableSynchronizationResponseMessage.UNSUPPORTED_TABLE_NAME,
        success: false,
        error_type: 'unsupported_table'
      });
    });

    it('should return error for invalid synchronization action', async () => {
      const request = {
        action: 'invalid_action' as any,
        organization_id: TEST_ORGANIZATION_ID,
        data: VALID_SUPPLIER_DATA,
      };

      const result = await service.synchronizeIfsTableData('supplier_info_tab', request);

      expect(result).toEqual({
        status: 400,
        message: IfsTableSynchronizationResponseMessage.INVALID_SYNCHRONIZATION_ACTION,
        success: false,
        error_type: 'invalid_action'
      });
    });
  });

  describe('registerNewIfsTableSynchronizationHandler', () => {
    class MockTableHandler {
      constructor(private prisma: any) {}
      
      async handleTableSynchronization() {
        return { status: 200, message: 'mock_handler_success' };
      }
      
      getIfsTableName() { return 'mock_table'; }
      getTargetDatabaseTableName() { return 'mock_target'; }
      getSupportedSynchronizationActions() { return ['insert']; }
    }

    it('should successfully register new table handler', () => {
      const initialCount = service.getNumberOfSupportedIfsTableNames();
      
      service.registerNewIfsTableSynchronizationHandler('mock_table', MockTableHandler as any);
      
      const newCount = service.getNumberOfSupportedIfsTableNames();
      const supportedTables = service.getSupportedIfsTableNames();
      
      expect(newCount).toBe(initialCount + 1);
      expect(supportedTables).toContain('mock_table');
    });

    it('should allow using newly registered handler', async () => {
      service.registerNewIfsTableSynchronizationHandler('mock_table', MockTableHandler as any);

      const request = {
        action: 'insert' as const,
        organization_id: TEST_ORGANIZATION_ID,
        data: { test: 'data' },
      };

      const result = await service.synchronizeIfsTableData('mock_table', request);

      expect(result).toEqual({
        status: 200,
        message: 'mock_handler_success',
        success: true
      });
    });
  });

  describe('error handling', () => {
    it('should handle database errors and return mapped error response', async () => {
      const databaseError = new Error('Database connection failed');
      mockPrismaClient.supplier.create.mockRejectedValue(databaseError);

      const request = {
        action: 'insert' as const,
        organization_id: TEST_ORGANIZATION_ID,
        data: VALID_SUPPLIER_DATA,
      };

      const result = await service.synchronizeIfsTableData('supplier_info_tab', request);

      expect(result.status).toBe(500);
      expect(result.message).toBe(IfsTableSynchronizationResponseMessage.UNKNOWN_DATABASE_OPERATION_ERROR);
    });

    it('should handle handler creation failure gracefully', async () => {
      // Create a handler class that throws in constructor
      class FailingHandler {
        constructor() {
          throw new Error('Handler creation failed');
        }
      }

      service.registerNewIfsTableSynchronizationHandler('failing_table', FailingHandler as any);

      const request = {
        action: 'insert' as const,
        organization_id: TEST_ORGANIZATION_ID,
        data: { test: 'data' },
      };

      const result = await service.synchronizeIfsTableData('failing_table', request);

      expect(result.status).toBe(500);
      expect(result.message).toBe(IfsTableSynchronizationResponseMessage.UNKNOWN_DATABASE_OPERATION_ERROR);
    });
  });

  describe('logging and audit trail', () => {
    it('should log start and completion of synchronization', async () => {
      const request = {
        action: 'insert' as const,
        organization_id: TEST_ORGANIZATION_ID,
        data: VALID_SUPPLIER_DATA,
      };

      await service.synchronizeIfsTableData('supplier_info_tab', request);

      // Check that logging methods were called with organization context
      expect(mockOrganizationContextLogger.logInformationWithOrganizationContext).toHaveBeenCalledWith(
        TEST_ORGANIZATION_ID,
        'Starting IFS table synchronization',
        expect.objectContaining({
          ifsTableName: 'supplier_info_tab',
          synchronizationAction: 'insert'
        })
      );
      
      expect(mockOrganizationContextLogger.logInformationWithOrganizationContext).toHaveBeenCalledWith(
        TEST_ORGANIZATION_ID,
        'IFS table synchronization completed successfully',
        expect.objectContaining({
          ifsTableName: 'supplier_info_tab',
          synchronizationAction: 'insert',
          result: IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_CREATED,
          executionTimeMs: expect.any(Number)
        })
      );
    });

    it('should log execution time in completion message', async () => {
      const request = {
        action: 'insert' as const,
        organization_id: TEST_ORGANIZATION_ID,
        data: VALID_SUPPLIER_DATA,
      };

      await service.synchronizeIfsTableData('supplier_info_tab', request);

      expect(mockOrganizationContextLogger.logInformationWithOrganizationContext).toHaveBeenCalledWith(
        TEST_ORGANIZATION_ID,
        'IFS table synchronization completed successfully',
        expect.objectContaining({
          executionTimeMs: expect.any(Number)
        })
      );
    });

    it('should log SQL audit information', async () => {
      const request = {
        action: 'insert' as const,
        organization_id: TEST_ORGANIZATION_ID,
        data: VALID_SUPPLIER_DATA,
      };

      await service.synchronizeIfsTableData('supplier_info_tab', request);

      expect(mockSqlAuditLogger.logIfsTableSqlOperationWithOrganizationContext).toHaveBeenCalledWith(
        TEST_ORGANIZATION_ID,
        'supplier_info_tab',
        'insert',
        expect.any(String),
        IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_CREATED,
        expect.any(Number)
      );
    });
  });

  describe('performance considerations', () => {
    it('should complete synchronization within reasonable time', async () => {
      const startTime = Date.now();

      const request = {
        action: 'insert' as const,
        organization_id: TEST_ORGANIZATION_ID,
        data: VALID_SUPPLIER_DATA,
      };

      await service.synchronizeIfsTableData('supplier_info_tab', request);

      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms for mocked operations
    });
  });
});