export type IfsTableSynchronizationAction = 'insert' | 'update' | 'upsert' | 'delete';

export interface IfsTableSynchronizationRequest {
  action: IfsTableSynchronizationAction;
  organization_id: string;
  data: any;
}

export interface IfsTableSynchronizationResponse {
  status: number;
  message: string;
  success: boolean;
}

export interface IfsTableSynchronizationResult {
  status: number;
  message: string;
  success: boolean;
}

export interface IfsSupplierInformationData {
  supplier_id?: string;
  name?: string;
  rowkey?: string;
  association_no?: string;
  b2b_supplier?: string;
  corporate_form?: string;
  country?: string;
  creation_date?: string;
  default_domain?: string;
  default_language?: string;
  identifier_ref_validation?: string;
  identifier_reference?: string;
  one_time?: string;
  party?: string;
  party_type?: string;
  picture_id?: string;
  rowtype?: string;
  rowversion?: string;
  supplier_category?: string;
  suppliers_own_id?: string;
  text_id$?: string;
  [key: string]: any;
}

export interface IfsPaymentAddressInformationData {
  company?: string;
  identity?: string;
  data2?: string;
  bic_code?: string;
  default_address?: string;
  blocked_for_use?: string;
  way_id?: string;
  address_id?: string;
  rowkey?: string;
  account?: string;
  bank_account_valid_date?: string;
  bank_account_validated?: string;
  description?: string;
  mapping_type?: string;
  party_type?: string;
  rowversion?: string;
  [key: string]: any;
}

export interface IfsSupplierDocumentTaxInformationData {
  company?: string;
  vat_no?: string;
  rowkey?: string;
  address_id?: string;
  declaration_date?: string;
  domestic_tax_id_number?: string;
  group_tax_id_number?: string;
  last_modify_date?: string;
  reliability_status?: string;
  rowversion?: string;
  supplier_id?: string;
  tax_id_no2?: string;
  tax_id_no3?: string;
  tax_id_no4?: string;
  tax_id_no5?: string;
  tax_id_no6?: string;
  tax_id_type?: string;
  tax_office_id?: string;
  validated_date?: string;
  [key: string]: any;
}