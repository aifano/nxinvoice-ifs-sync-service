import { testClient, testDbHelper } from './test-utilities';
import { IfsTableSynchronizationResponseMessage, IfsTableSynchronizationErrorType } from '../../src/types/ifs-table-synchronization-response-messages';

describe('Supplier Information CRUD - E2E Tests', () => {
  const SUPPLIER_TEST_DATA = {
    supplier_id: 'E2E_SUPPLIER_001',
    name: 'E2E Test Lieferant GmbH',
    rowkey: 'e2e_supplier_key_001',
    association_no: 'ASSOC_001',
    b2b_supplier: 'TRUE',
    corporate_form: 'GmbH',
    country: 'DE',
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
    it('CREATE: Neuen Lieferanten anlegen', async () => {
      const request = {
        action: 'insert',
        data: SUPPLIER_TEST_DATA,
      };

      const response = await testClient.makeRequest('supplier_info_tab', request);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_CREATED);
      expect(response.body.success).toBe(true);
      
      // Verify in database
      const supplierExists = await testDbHelper.verifySupplierExists(SUPPLIER_TEST_DATA.rowkey);
      expect(supplierExists).toBe(true);
    });

    it('UPDATE: Lieferanten-Daten aktualisieren', async () => {
      // Erst anlegen
      await testClient.makeRequest('supplier_info_tab', {
        action: 'insert',
        data: SUPPLIER_TEST_DATA,
      });

      // Dann updaten
      const updatedData = { 
        ...SUPPLIER_TEST_DATA, 
        name: 'E2E Test Lieferant GmbH - UPDATED' 
      };
      
      const response = await testClient.makeRequest('supplier_info_tab', {
        action: 'update',
        data: updatedData,
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_UPDATED);
      expect(response.body.success).toBe(true);
      
      // Verify update in database
      const supplier = await testDbHelper.getSupplierByExternalId(SUPPLIER_TEST_DATA.rowkey);
      expect(supplier?.name).toBe('E2E Test Lieferant GmbH - UPDATED');
    });

    it('UPSERT: Insert-or-Update Operation', async () => {
      const response = await testClient.makeRequest('supplier_info_tab', {
        action: 'upsert',
        data: SUPPLIER_TEST_DATA,
      });

      expect(response.status).toBe(200);
      expect([
        IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_CREATED_VIA_UPSERT,
        IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_UPDATED_VIA_UPSERT
      ]).toContain(response.body.status);
      expect(response.body.success).toBe(true);
      
      // Verify in database
      const supplierExists = await testDbHelper.verifySupplierExists(SUPPLIER_TEST_DATA.rowkey);
      expect(supplierExists).toBe(true);
    });

    it('DELETE: Lieferanten löschen', async () => {
      // Erst anlegen
      await testClient.makeRequest('supplier_info_tab', {
        action: 'insert',
        data: SUPPLIER_TEST_DATA,
      });

      // Dann löschen
      const response = await testClient.makeRequest('supplier_info_tab', {
        action: 'delete',
        data: { rowkey: SUPPLIER_TEST_DATA.rowkey },
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_DELETED);
      expect(response.body.success).toBe(true);
      
      // Verify deletion in database
      const supplierExists = await testDbHelper.verifySupplierExists(SUPPLIER_TEST_DATA.rowkey);
      expect(supplierExists).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('UPDATE: Supplier der nicht existiert', async () => {
      const response = await testClient.makeRequest('supplier_info_tab', {
        action: 'update',
        data: {
          supplier_id: 'NICHT_EXISTIERENDER_SUPPLIER',
          name: 'Gibt es nicht',
          rowkey: 'nicht_da_key_999',
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.RECORD_NOT_FOUND);
      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe(IfsTableSynchronizationErrorType.RECORD_NOT_FOUND);
    });

    it('DELETE: Supplier der nicht existiert', async () => {
      const response = await testClient.makeRequest('supplier_info_tab', {
        action: 'delete',
        data: { rowkey: 'phantom_supplier_key_999' },
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.RECORD_NOT_FOUND);
      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe(IfsTableSynchronizationErrorType.RECORD_NOT_FOUND);
    });
  });

  describe('Organization ID Security', () => {
    const SUPPLIER_DATA = {
      supplier_id: 'ORG_TEST_SUPPLIER',
      name: 'Organization Test Supplier',
      rowkey: 'org_test_key_001',
    };

    it('DELETE mit falscher organization_id', async () => {
      // Erst mit korrekter Org ID anlegen
      await testClient.makeRequest('supplier_info_tab', {
        action: 'insert',
        data: SUPPLIER_DATA,
      }, testClient.getTestOrganizationId());

      // Dann mit falscher Org ID löschen versuchen
      const response = await testClient.makeRequest('supplier_info_tab', {
        action: 'delete',
        data: { rowkey: SUPPLIER_DATA.rowkey },
      }, testClient.getWrongOrganizationId());

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.RECORD_NOT_FOUND);
      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe(IfsTableSynchronizationErrorType.RECORD_NOT_FOUND);
    });

    it('UPDATE mit falscher organization_id', async () => {
      // Erst mit korrekter Org ID anlegen
      await testClient.makeRequest('supplier_info_tab', {
        action: 'insert',
        data: SUPPLIER_DATA,
      }, testClient.getTestOrganizationId());

      // Dann mit falscher Org ID updaten versuchen
      const response = await testClient.makeRequest('supplier_info_tab', {
        action: 'update',
        data: { ...SUPPLIER_DATA, name: 'Hacker Update' },
      }, testClient.getWrongOrganizationId());

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.RECORD_NOT_FOUND);
      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe(IfsTableSynchronizationErrorType.RECORD_NOT_FOUND);
    });
  });
});