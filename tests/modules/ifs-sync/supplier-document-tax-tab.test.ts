import { apiRequest } from '../../common/api-client';
import { expectSuccessResponse, generateRandomId, generateRandomRowKey } from '../../common/test-utils';
import { createTaxData, createTaxDataWithDifferentVatFormats, VAT_FORMATS } from './test-data';
import { createAndCleanupTax } from './test-helpers';

describe('IFS Sync - Supplier Document Tax Tab', () => {
  let randomCompany: string;
  let randomSupplierId: string;
  let randomAddressId: string;
  let randomRowKey: string;
  let updatedVatNo: string;
  
  // Second entry
  let secondCompany: string;
  let secondSupplierId: string;
  let secondAddressId: string;
  let secondRowKey: string;

  beforeAll(() => {
    randomCompany = generateRandomId();
    randomSupplierId = generateRandomId();
    randomAddressId = generateRandomId();
    randomRowKey = generateRandomRowKey();
    updatedVatNo = 'DE987654321';
    
    // Second entry
    secondCompany = generateRandomId();
    secondSupplierId = generateRandomId();
    secondAddressId = generateRandomId();
    secondRowKey = generateRandomRowKey();
  });

  describe('Happy Path Tests', () => {
    it('should create second tax entry for isolation test', async () => {
      const response = await apiRequest('/supplier_document_tax_info_tab', {
        action: 'upsert',
        data: createTaxData(secondCompany, secondSupplierId, secondAddressId, secondRowKey)
      });

      expectSuccessResponse(response, 'created successfully');
    });

    it('should create tax document entry successfully', async () => {
      const response = await apiRequest('/supplier_document_tax_info_tab', {
        action: 'upsert',
        data: createTaxData(randomCompany, randomSupplierId, randomAddressId, randomRowKey)
      });

      expectSuccessResponse(response, 'created successfully');
    });

    it('should update existing tax document entry', async () => {
      const updatedData = createTaxData(randomCompany, randomSupplierId, randomAddressId, randomRowKey);
      updatedData.vat_no = updatedVatNo;

      const response = await apiRequest('/supplier_document_tax_info_tab', {
        action: 'upsert',
        data: updatedData
      });

      expectSuccessResponse(response, 'updated successfully');
    });

    it('should delete tax document entry successfully', async () => {
      const response = await apiRequest('/supplier_document_tax_info_tab', {
        action: 'delete',
        data: { rowkey: randomRowKey }
      });

      expectSuccessResponse(response, 'deleted successfully');
    });

    it('should handle delete of non-existent tax entry (should return false)', async () => {
      const response = await apiRequest('/supplier_document_tax_info_tab', {
        action: 'delete',
        data: { rowkey: randomRowKey }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(false);
      expect(response.data.message).toContain('not found or already deleted');
    });

    it('should verify second tax entry was not affected', async () => {
      const response = await apiRequest('/supplier_document_tax_info_tab', {
        action: 'upsert',
        data: createTaxData(secondCompany, secondSupplierId, secondAddressId, secondRowKey)
      });

      expectSuccessResponse(response, 'updated successfully');
      
      // Clean up
      await apiRequest('/supplier_document_tax_info_tab', {
        action: 'delete',
        data: { rowkey: secondRowKey }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle different VAT number formats', async () => {
      const { data, cleanup } = await createAndCleanupTax();
      
      // Test different VAT formats
      for (const vatNo of VAT_FORMATS) {
        const response = await apiRequest('/supplier_document_tax_info_tab', {
          action: 'upsert',
          data: createTaxDataWithDifferentVatFormats(data.company, data.supplier_id, data.address_id, data.rowkey, vatNo)
        });

        expectSuccessResponse(response);
      }
      
      await cleanup();
    });

    it('should handle missing VAT number', async () => {
      const testRowKey = generateRandomRowKey();
      
      const response = await apiRequest('/supplier_document_tax_info_tab', {
        action: 'upsert',
        data: {
          company: generateRandomId(),
          supplier_id: generateRandomId(),
          address_id: generateRandomId(),
          rowkey: testRowKey
          // Missing vat_no
        }
      });

      expectSuccessResponse(response);
      
      // Clean up
      await apiRequest('/supplier_document_tax_info_tab', {
        action: 'delete',
        data: { rowkey: testRowKey }
      });
    });

    it('should handle special characters in VAT number', async () => {
      const testRowKey = generateRandomRowKey();
      const testData = createTaxData(generateRandomId(), generateRandomId(), generateRandomId(), testRowKey);
      testData.vat_no = 'DE-123.456/789';
      
      const response = await apiRequest('/supplier_document_tax_info_tab', {
        action: 'upsert',
        data: testData
      });

      expectSuccessResponse(response);
      
      // Clean up
      await apiRequest('/supplier_document_tax_info_tab', {
        action: 'delete',
        data: { rowkey: testRowKey }
      });
    });
  });
});
