// IFS Sync Module - Specific Test Helpers
import { apiRequest } from '../../common/api-client';
import { createSupplierData, createPaymentData, createTaxData, generateSupplierId, generateCompanyId, generateAddressId, generateRowKey } from './test-data';

// IFS Sync specific helper functions
export const createAndCleanupSupplier = async (supplierId?: string, name?: string, rowkey?: string) => {
  const supplierData = createSupplierData(supplierId, name, rowkey);

  // Create supplier
  const createResponse = await apiRequest('/supplier_info_tab', {
    action: 'upsert',
    data: supplierData
  });

  // Return cleanup function
  const cleanup = async () => {
    await apiRequest('/supplier_info_tab', {
      action: 'delete',
      data: { rowkey: supplierData.rowkey }
    });
  };

  return {
    response: createResponse,
    data: supplierData,
    cleanup
  };
};

export const createAndCleanupPayment = async (company?: string, identity?: string, addressId?: string, rowkey?: string) => {
  const paymentData = createPaymentData(company, identity, addressId, rowkey);

  // Create payment
  const createResponse = await apiRequest('/payment_address_tab', {
    action: 'upsert',
    data: paymentData
  });

  // Return cleanup function
  const cleanup = async () => {
    await apiRequest('/payment_address_tab', {
      action: 'delete',
      data: { rowkey: paymentData.rowkey }
    });
  };

  return {
    response: createResponse,
    data: paymentData,
    cleanup
  };
};

export const createAndCleanupTax = async (company?: string, supplierId?: string, addressId?: string, rowkey?: string) => {
  const taxData = createTaxData(company, supplierId, addressId, rowkey);

  // Create tax document
  const createResponse = await apiRequest('/supplier_document_tax_info_tab', {
    action: 'upsert',
    data: taxData
  });

  // Return cleanup function
  const cleanup = async () => {
    await apiRequest('/supplier_document_tax_info_tab', {
      action: 'delete',
      data: { rowkey: taxData.rowkey }
    });
  };

  return {
    response: createResponse,
    data: taxData,
    cleanup
  };
};

// Batch operations for isolation testing
export const createMultipleSuppliers = async (count: number) => {
  const suppliers = [];
  const cleanupFunctions = [];

  for (let i = 0; i < count; i++) {
    const { response, data, cleanup } = await createAndCleanupSupplier();
    suppliers.push({ response, data });
    cleanupFunctions.push(cleanup);
  }

  const cleanupAll = async () => {
    await Promise.all(cleanupFunctions.map(cleanup => cleanup()));
  };

  return { suppliers, cleanupAll };
};
