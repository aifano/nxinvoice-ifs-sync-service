import { testClient, testDbHelper } from './test-utilities';
import { IfsTableSynchronizationResponseMessage, IfsTableSynchronizationErrorType } from '../../src/types/ifs-table-synchronization-response-messages';

describe('Payment Address CRUD - E2E Tests', () => {
  const PAYMENT_ADDRESS_DATA = {
    company: 'E2E_COMPANY_001',
    identity: 'E2E_SUPPLIER_001', 
    data2: 'E2E Test Bank AG',
    bic_code: 'E2ETESTBANK123',
    default_address: 'TRUE',
    blocked_for_use: 'FALSE',
    way_id: 'E2E_WAY_001',
    address_id: 'E2E_ADDR_001',
    rowkey: 'e2e_payment_addr_key_001',
    account: 'DE89370400440532013000',
    description: 'E2E Test Bankkonto',

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
    it('CREATE: Neue Zahlungsadresse anlegen', async () => {
      const response = await testClient.makeRequest('payment_address_tab', {
        action: 'insert',
        data: PAYMENT_ADDRESS_DATA,
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_CREATED);
      expect(response.body.success).toBe(true);
      
      // Verify in database
      const addressExists = await testDbHelper.verifyPaymentAddressExists(PAYMENT_ADDRESS_DATA.rowkey);
      expect(addressExists).toBe(true);
    });

    it('UPDATE: Zahlungsadresse aktualisieren', async () => {
      // Erst anlegen
      await testClient.makeRequest('payment_address_tab', {
        action: 'insert',
        data: PAYMENT_ADDRESS_DATA,
      });

      // Dann updaten
      const updatedData = { 
        ...PAYMENT_ADDRESS_DATA, 
        data2: 'E2E Test Bank AG - UPDATED',
        default_address: 'FALSE'
      };

      const response = await testClient.makeRequest('payment_address_tab', {
        action: 'update',
        data: updatedData,
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_UPDATED);
      expect(response.body.success).toBe(true);
      
      // Verify update in database
      const address = await testDbHelper.getPaymentAddressByExternalId(PAYMENT_ADDRESS_DATA.rowkey);
      expect(address?.bank_name).toBe('E2E Test Bank AG - UPDATED');
    });

    it('UPSERT: Insert-or-Update Operation', async () => {
      const response = await testClient.makeRequest('payment_address_tab', {
        action: 'upsert',
        data: PAYMENT_ADDRESS_DATA,
      });

      expect(response.status).toBe(200);
      expect([
        IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_CREATED_VIA_UPSERT,
        IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_UPDATED_VIA_UPSERT
      ]).toContain(response.body.status);
      expect(response.body.success).toBe(true);
      
      // Verify in database
      const addressExists = await testDbHelper.verifyPaymentAddressExists(PAYMENT_ADDRESS_DATA.rowkey);
      expect(addressExists).toBe(true);
    });

    it('DELETE: Zahlungsadresse löschen', async () => {
      // Erst anlegen
      await testClient.makeRequest('payment_address_tab', {
        action: 'insert', 
        data: PAYMENT_ADDRESS_DATA,
      });

      // Dann löschen
      const response = await testClient.makeRequest('payment_address_tab', {
        action: 'delete',
        data: { rowkey: PAYMENT_ADDRESS_DATA.rowkey },
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.PAYMENT_ADDRESS_DELETED);
      expect(response.body.success).toBe(true);
      
      // Verify deletion in database
      const addressExists = await testDbHelper.verifyPaymentAddressExists(PAYMENT_ADDRESS_DATA.rowkey);
      expect(addressExists).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('UPDATE: Payment Address die nicht existiert', async () => {
      const response = await testClient.makeRequest('payment_address_tab', {
        action: 'update',
        data: {
          rowkey: 'nicht_existierende_addr_999',
          data2: 'Phantom Bank',
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.RECORD_NOT_FOUND);
      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe(IfsTableSynchronizationErrorType.RECORD_NOT_FOUND);
    });

    it('DELETE: Payment Address die nicht existiert', async () => {
      const response = await testClient.makeRequest('payment_address_tab', {
        action: 'delete',
        data: { rowkey: 'phantom_payment_key_999' },
      });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.RECORD_NOT_FOUND);
      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe(IfsTableSynchronizationErrorType.RECORD_NOT_FOUND);
    });
  });
});