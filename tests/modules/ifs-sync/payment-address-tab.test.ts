import { apiRequest } from '../../common/api-client';
import { expectSuccessResponse, generateRandomId, generateRandomRowKey } from '../../common/test-utils';
import { createPaymentData, createPaymentDataWithDifferentFormats } from './test-data';
import { createAndCleanupPayment } from './test-helpers';

describe('IFS Sync - Payment Address Tab', () => {
  let randomCompany: string;
  let randomIdentity: string;
  let randomAddressId: string;
  let randomRowKey: string;
  let updatedAccount: string;
  
  // Second entry
  let secondCompany: string;
  let secondIdentity: string;
  let secondAddressId: string;
  let secondRowKey: string;

  beforeAll(() => {
    randomCompany = generateRandomId();
    randomIdentity = generateRandomId();
    randomAddressId = generateRandomId();
    randomRowKey = generateRandomRowKey();
    updatedAccount = 'DE89370400440532013999';
    
    // Second entry
    secondCompany = generateRandomId();
    secondIdentity = generateRandomId();
    secondAddressId = generateRandomId();
    secondRowKey = generateRandomRowKey();
  });

  describe('Happy Path Tests', () => {
    it('should create second payment entry for isolation test', async () => {
      const response = await apiRequest('/payment_address_tab', {
        action: 'upsert',
        data: createPaymentData(secondCompany, secondIdentity, secondAddressId, secondRowKey)
      });

      expectSuccessResponse(response, 'created successfully');
    });

    it('should create payment address entry successfully', async () => {
      const response = await apiRequest('/payment_address_tab', {
        action: 'upsert',
        data: createPaymentData(randomCompany, randomIdentity, randomAddressId, randomRowKey)
      });

      expectSuccessResponse(response, 'created successfully');
    });

    it('should update existing payment address entry', async () => {
      const updatedData = createPaymentData(randomCompany, randomIdentity, randomAddressId, randomRowKey);
      updatedData.account = updatedAccount;

      const response = await apiRequest('/payment_address_tab', {
        action: 'upsert',
        data: updatedData
      });

      expectSuccessResponse(response, 'updated successfully');
    });

    it('should delete payment address entry successfully', async () => {
      const response = await apiRequest('/payment_address_tab', {
        action: 'delete',
        data: { rowkey: randomRowKey }
      });

      expectSuccessResponse(response, 'deleted successfully');
    });

    it('should handle delete of non-existent payment entry (should return false)', async () => {
      const response = await apiRequest('/payment_address_tab', {
        action: 'delete',
        data: { rowkey: randomRowKey }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('not found or already deleted');
    });

    it('should verify second payment entry was not affected', async () => {
      const response = await apiRequest('/payment_address_tab', {
        action: 'upsert',
        data: createPaymentData(secondCompany, secondIdentity, secondAddressId, secondRowKey)
      });

      expectSuccessResponse(response, 'updated successfully');
      
      // Clean up
      await apiRequest('/payment_address_tab', {
        action: 'delete',
        data: { rowkey: secondRowKey }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle different account and BIC formats', async () => {
      const { data, cleanup } = await createAndCleanupPayment();
      
      const response = await apiRequest('/payment_address_tab', {
        action: 'upsert',
        data: createPaymentDataWithDifferentFormats(data.company, data.identity, data.address_id, data.rowkey)
      });

      expectSuccessResponse(response);
      await cleanup();
    });

    it('should handle missing optional fields', async () => {
      const testRowKey = generateRandomRowKey();
      
      const response = await apiRequest('/payment_address_tab', {
        action: 'upsert',
        data: {
          company: generateRandomId(),
          identity: generateRandomId(),
          address_id: generateRandomId(),
          rowkey: testRowKey
          // Missing account and bic_code
        }
      });

      expectSuccessResponse(response);
      
      // Clean up
      await apiRequest('/payment_address_tab', {
        action: 'delete',
        data: { rowkey: testRowKey }
      });
    });

    it('should handle numeric values as strings', async () => {
      const testRowKey = generateRandomRowKey();
      
      const response = await apiRequest('/payment_address_tab', {
        action: 'upsert',
        data: {
          company: '12345',
          identity: '67890',
          address_id: '99999',
          rowkey: testRowKey,
          account: '11111111111111111111',
          bic_code: 'TEST1234567'
        }
      });

      expectSuccessResponse(response);
      
      // Clean up
      await apiRequest('/payment_address_tab', {
        action: 'delete',
        data: { rowkey: testRowKey }
      });
    });
  });
});
