import { apiRequest } from '../../common/api-client';
import { expectSuccessResponse, generateRandomName } from '../../common/test-utils';
import { createSupplierData, createSupplierDataWithSpecialChars, createSupplierDataWithLongValues, generateSupplierId, generateRowKey } from './test-data';
import { createAndCleanupSupplier, createMultipleSuppliers } from './test-helpers';

describe('IFS Sync - Supplier Info Tab', () => {
  let randomSupplierId: string;
  let randomSupplierName: string;
  let randomRowKey: string;
  let updatedSupplierName: string;
  
  // Second entry for isolation test
  let secondSupplierId: string;
  let secondSupplierName: string;
  let secondRowKey: string;

  beforeAll(() => {
    // Generate test data with Faker
    randomSupplierId = generateSupplierId();
    randomSupplierName = generateRandomName();
    randomRowKey = generateRowKey();
    updatedSupplierName = generateRandomName();

    // Second entry
    secondSupplierId = generateSupplierId();
    secondSupplierName = generateRandomName();
    secondRowKey = generateRowKey();
  });

  describe('Happy Path Tests', () => {
    it('should create second supplier entry for isolation test', async () => {
      const response = await apiRequest('/supplier_info_tab', {
        action: 'upsert',
        data: createSupplierData(secondSupplierId, secondSupplierName, secondRowKey)
      });

      expectSuccessResponse(response, 'created successfully');
    });

    it('should create supplier entry successfully', async () => {
      const response = await apiRequest('/supplier_info_tab', {
        action: 'upsert',
        data: createSupplierData(randomSupplierId, randomSupplierName, randomRowKey)
      });

      expectSuccessResponse(response, 'created successfully');
    });

    it('should update existing supplier entry', async () => {
      const response = await apiRequest('/supplier_info_tab', {
        action: 'upsert',
        data: createSupplierData(randomSupplierId, updatedSupplierName, randomRowKey)
      });

      expectSuccessResponse(response, 'updated successfully');
    });

    it('should handle insert action (same as upsert)', async () => {
      const { data, cleanup } = await createAndCleanupSupplier();
      
      const response = await apiRequest('/supplier_info_tab', {
        action: 'insert',
        data: createSupplierData(data.supplier_id, data.name, data.rowkey)
      });

      expectSuccessResponse(response);
      await cleanup();
    });

    it('should handle update action (same as upsert)', async () => {
      const response = await apiRequest('/supplier_info_tab', {
        action: 'update',
        data: createSupplierData(randomSupplierId, 'Updated Name', randomRowKey)
      });

      expectSuccessResponse(response, 'updated successfully');
    });

    it('should delete supplier entry successfully', async () => {
      const response = await apiRequest('/supplier_info_tab', {
        action: 'delete',
        data: { rowkey: randomRowKey }
      });

      expectSuccessResponse(response, 'deleted successfully');
    });

    it('should handle delete of non-existent supplier entry (should return false)', async () => {
      const response = await apiRequest('/supplier_info_tab', {
        action: 'delete',
        data: { rowkey: randomRowKey }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('not found or already deleted');
    });

    it('should verify second supplier entry was not affected', async () => {
      // Try to update second entry to verify it still exists
      const response = await apiRequest('/supplier_info_tab', {
        action: 'upsert',
        data: createSupplierData(secondSupplierId, secondSupplierName, secondRowKey)
      });

      expectSuccessResponse(response, 'updated successfully');
      
      // Clean up second entry
      await apiRequest('/supplier_info_tab', {
        action: 'delete',
        data: { rowkey: secondRowKey }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in data', async () => {
      const { data, cleanup } = await createAndCleanupSupplier();

      // Update with special characters
      const specialData = createSupplierDataWithSpecialChars();
      const updateResponse = await apiRequest('/supplier_info_tab', {
        action: 'upsert',
        data: { ...specialData, rowkey: data.rowkey }
      });

      expectSuccessResponse(updateResponse);
      await cleanup();
    });

    it('should handle very long supplier names', async () => {
      const { data, cleanup } = await createAndCleanupSupplier();

      // Update with long values
      const longData = createSupplierDataWithLongValues();
      const updateResponse = await apiRequest('/supplier_info_tab', {
        action: 'upsert',
        data: { ...longData, rowkey: data.rowkey }
      });

      expectSuccessResponse(updateResponse);
      await cleanup();
    });

    it('should handle multiple suppliers without interference', async () => {
      const { suppliers, cleanupAll } = await createMultipleSuppliers(3);
      
      // Verify all suppliers were created
      suppliers.forEach(({ response }) => {
        expectSuccessResponse(response, 'created successfully');
      });

      await cleanupAll();
    });
  });
});
