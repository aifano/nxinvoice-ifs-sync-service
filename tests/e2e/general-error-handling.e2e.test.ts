import { testClient } from './test-utilities';
import { IfsTableSynchronizationResponseMessage, IfsTableSynchronizationErrorType } from '../../src/types/ifs-table-synchronization-response-messages';

describe('General Error Handling - E2E Tests', () => {
  describe('Organization ID Validation and Security', () => {
    const SUPPLIER_DATA = {
      supplier_id: 'ORG_TEST_SUPPLIER',
      name: 'Organization Test Supplier',
      rowkey: 'org_test_key_001',
    };

    it('Fehlende organization_id im Header', async () => {
      const response = await testClient.makeRequestWithoutOrganizationId('supplier_info_tab', {
        action: 'insert', 
        data: SUPPLIER_DATA
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.ORGANIZATION_ID_REQUIRED);
      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe(IfsTableSynchronizationErrorType.ORGANIZATION_ID_MISSING);
    });

    it('Leere organization_id im Header', async () => {
      const response = await testClient.makeRequest('supplier_info_tab', {
        action: 'insert',
        data: SUPPLIER_DATA,
      }, '');

      expect(response.status).toBe(400);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.ORGANIZATION_ID_REQUIRED);
      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe(IfsTableSynchronizationErrorType.ORGANIZATION_ID_MISSING);
    });
  });

  describe('Table and Action Validation', () => {
    it('Ungültige IFS Tabelle', async () => {
      const response = await testClient.makeRequest('ungueltige_tabelle', {
        action: 'insert',
        data: { test: 'data' },
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.UNSUPPORTED_TABLE_NAME);
      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe(IfsTableSynchronizationErrorType.UNSUPPORTED_TABLE);
    });

    it('Ungültige Synchronization Action', async () => {
      const response = await testClient.makeRequest('supplier_info_tab', {
        action: 'ungueltige_action',
        data: { test: 'data' },
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.INVALID_SYNCHRONIZATION_ACTION);
      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe(IfsTableSynchronizationErrorType.INVALID_ACTION);
    });
  });

  describe('JSON Payload Validation', () => {
    it('Malformed JSON Payload', async () => {
      const response = await testClient.makeRequestWithMalformedJson(
        'supplier_info_tab', 
        '{ "action": "insert", "data": { invalid json'
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(IfsTableSynchronizationResponseMessage.INVALID_JSON_PAYLOAD);
      expect(response.body.success).toBe(false);
      expect(response.body.error_type).toBe(IfsTableSynchronizationErrorType.MALFORMED_JSON);
    });
  });
});