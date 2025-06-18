import { testClient, testDbHelper } from './test-utilities';
import { IfsTableSynchronizationResponseMessage, IfsTableSynchronizationErrorType } from '../../src/types/ifs-table-synchronization-response-messages';

describe('Supplier Tax Information CRUD - E2E Tests', () => {
  const SUPPLIER_BASE_DATA = {
    supplier_id: 'E2E_SUPPLIER_001',
    name: 'E2E Test Lieferant GmbH',
    rowkey: 'e2e_tax_info_key_001',
    association_no: 'ASSOC_001',
    b2b_supplier: 'TRUE',
    corporate_form: 'GmbH',
    country: 'DE',
  };

  const TAX_INFO_DATA = {
    company: 'E2E_COMPANY_001',
    identity: 'E2E_SUPPLIER_001',
    tax_liability_country_db: 'DE',
    tax_liability_type_db: 'TAXABLE',
    rowkey: 'e2e_tax_info_key_001',
    description: 'E2E Test Steuerinformationen',
  };

  // Cleanup nach jedem Test
  afterEach(async () => {
    await testDbHelper.cleanupTestData();
  });

  // Cleanup nach allen Tests
  afterAll(async () => {
    await testDbHelper.disconnect();
  });

  describe('CRUD Operations', () => {
    it('CREATE: Neue Steuerinformationen anlegen', async () => {
      // Erst Supplier anlegen
      await testClient.makeRequest('supplier_info_tab', {
        action: 'insert',
        data: SUPPLIER_BASE_DATA,
      });

      const response = await testClient.makeRequest('supplier_document_tax_info_tab', {
        action: 'insert',
        data: TAX_INFO_DATA,
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.SUPPLIER_TAX_INFORMATION_UPDATED);
      expect(response.body.success).toBe(true);
    });

    it('UPDATE: Steuerinformationen aktualisieren', async () => {
      // Erst Supplier anlegen
      await testClient.makeRequest('supplier_info_tab', {
        action: 'insert',
        data: SUPPLIER_BASE_DATA,
      });

      // Dann Tax Info anlegen
      await testClient.makeRequest('supplier_document_tax_info_tab', {
        action: 'insert',
        data: TAX_INFO_DATA,
      });

      // Dann updaten
      const updatedData = {
        ...TAX_INFO_DATA,
        tax_liability_type_db: 'EXEMPT',
        description: 'E2E Test Steuerinformationen - UPDATED'
      };

      const response = await testClient.makeRequest('supplier_document_tax_info_tab', {
        action: 'update',
        data: updatedData,
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.SUPPLIER_TAX_INFORMATION_UPDATED);
      expect(response.body.success).toBe(true);
    });

    it('UPSERT: Insert-or-Update Operation', async () => {
      // Erst Supplier anlegen
      await testClient.makeRequest('supplier_info_tab', {
        action: 'insert',
        data: SUPPLIER_BASE_DATA,
      });

      const response = await testClient.makeRequest('supplier_document_tax_info_tab', {
        action: 'upsert',
        data: TAX_INFO_DATA,
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.SUPPLIER_TAX_INFORMATION_UPDATED);
      expect(response.body.success).toBe(true);
    });

    it('DELETE: Steuerinformationen löschen (wird übersprungen)', async () => {
      // Erst Supplier anlegen
      await testClient.makeRequest('supplier_info_tab', {
        action: 'insert',
        data: SUPPLIER_BASE_DATA,
      });

      // Dann Tax Info anlegen
      await testClient.makeRequest('supplier_document_tax_info_tab', {
        action: 'insert',
        data: TAX_INFO_DATA,
      });

      // Dann löschen versuchen
      const response = await testClient.makeRequest('supplier_document_tax_info_tab', {
        action: 'delete',
        data: { rowkey: TAX_INFO_DATA.rowkey },
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.SUPPLIER_TAX_INFORMATION_DELETION_SKIPPED);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('UPDATE: Tax Info die nicht existiert', async () => {
      const response = await testClient.makeRequest('supplier_document_tax_info_tab', {
        action: 'update',
        data: {
          rowkey: 'nicht_existierende_tax_999',
          description: 'Phantom Tax Info',
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.RECORD_NOT_FOUND);
      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe(IfsTableSynchronizationErrorType.RECORD_NOT_FOUND);
    });
  });
});