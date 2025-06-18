import { 
  IfsSupplierInformationData, 
  IfsPaymentAddressInformationData, 
  IfsSupplierDocumentTaxInformationData 
} from '../../src/types/ifs-table-synchronization';

export const TEST_ORGANIZATION_ID = 'test_organization_12345';

export const VALID_SUPPLIER_DATA: IfsSupplierInformationData = {
  supplier_id: 'SUPPLIER_001',
  name: 'Test Supplier Company GmbH',
  rowkey: 'supplier_rowkey_123',
  association_no: 'ASSOC_001',
  b2b_supplier: 'TRUE',
  corporate_form: 'GmbH',
  country: 'DE',
  creation_date: '2025-01-01',
  default_domain: 'test-supplier.com',
  default_language: 'DE',
  identifier_ref_validation: 'VALIDATED',
  identifier_reference: 'REF_123',
  one_time: 'FALSE',
  party: 'SUPPLIER',
  party_type: 'ORGANIZATION',
  supplier_category: 'PREMIUM',
  suppliers_own_id: 'OWN_ID_123',
};

export const VALID_PAYMENT_ADDRESS_DATA: IfsPaymentAddressInformationData = {
  company: 'COMPANY_001',
  identity: 'SUPPLIER_001',
  data2: 'Deutsche Bank AG',
  bic_code: 'DEUTDEFF123',
  default_address: 'TRUE',
  blocked_for_use: 'FALSE',
  way_id: 'WAY_001',
  address_id: 'ADDR_001',
  rowkey: 'payment_address_rowkey_123',
  account: 'DE89370400440532013000',
  bank_account_valid_date: '2025-12-31',
  bank_account_validated: 'TRUE',
  description: 'Main bank account for payments',
  mapping_type: 'BANK_ACCOUNT',
  party_type: 'SUPPLIER',
  rowversion: '1.0',
};

export const VALID_SUPPLIER_TAX_DATA: IfsSupplierDocumentTaxInformationData = {
  company: 'COMPANY_001',
  vat_no: 'DE123456789',
  rowkey: 'supplier_rowkey_123',
  address_id: 'ADDR_001',
  declaration_date: '2025-01-01',
  domestic_tax_id_number: 'TAX_001',
  group_tax_id_number: 'GROUP_TAX_001',
  last_modify_date: '2025-06-18',
  reliability_status: 'RELIABLE',
  rowversion: '1.0',
  supplier_id: 'SUPPLIER_001',
  tax_id_no2: 'TAX_002',
  tax_id_no3: 'TAX_003',
  tax_office_id: 'OFFICE_001',
  validated_date: '2025-01-15',
};

export const INVALID_DATA_MISSING_REQUIRED_FIELDS = {
  rowkey: 'test_key_without_required_fields',
};

export const MALFORMED_DATA_WITH_NULL_VALUES = {
  supplier_id: null,
  name: undefined,
  rowkey: 'test_key_with_null_values',
};

export const EDGE_CASE_DATA_WITH_SPECIAL_CHARACTERS = {
  supplier_id: 'SUPPLIER_WITH_SPECIAL_CHARS_äöü@#$%',
  name: 'Test Supplier "With Quotes" & Special <Characters>',
  rowkey: 'special_chars_key_äöü@#$%',
};