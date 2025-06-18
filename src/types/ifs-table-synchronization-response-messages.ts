export enum IfsTableSynchronizationErrorType {
  // Business Logic Errors (Status 200, but error occurred)
  RECORD_NOT_FOUND = 'record_not_found',
  DUPLICATE_RECORD = 'duplicate_record',
  
  // Request Validation Errors
  INVALID_REQUEST_DATA = 'invalid_request_data',
  ORGANIZATION_ID_MISSING = 'organization_id_missing',
  UNSUPPORTED_TABLE = 'unsupported_table',
  INVALID_ACTION = 'invalid_action',
  MALFORMED_JSON = 'malformed_json',
  
  // Technical Errors (These should cause retries)
  DATABASE_CONNECTION_ERROR = 'database_connection_error',
  DATABASE_SCHEMA_ERROR = 'database_schema_error',
  FOREIGN_KEY_VIOLATION = 'foreign_key_violation',
  UNKNOWN_ERROR = 'unknown_error'
}

export enum IfsTableSynchronizationResponseMessage {
  // Supplier Information Messages
  SUPPLIER_INFORMATION_CREATED = 'Supplier information record created successfully',
  SUPPLIER_INFORMATION_UPDATED = 'Supplier information record updated successfully', 
  SUPPLIER_INFORMATION_CREATED_VIA_UPSERT = 'Supplier information record created via upsert operation',
  SUPPLIER_INFORMATION_UPDATED_VIA_UPSERT = 'Supplier information record updated via upsert operation',
  SUPPLIER_INFORMATION_DELETED = 'Supplier information record deleted successfully',

  // Payment Address Messages
  PAYMENT_ADDRESS_CREATED = 'Payment address record created successfully',
  PAYMENT_ADDRESS_UPDATED = 'Payment address record updated successfully',
  PAYMENT_ADDRESS_CREATED_VIA_UPSERT = 'Payment address record created via upsert operation',
  PAYMENT_ADDRESS_UPDATED_VIA_UPSERT = 'Payment address record updated via upsert operation',
  PAYMENT_ADDRESS_DELETED = 'Payment address record deleted successfully',

  // Supplier Tax Information Messages
  SUPPLIER_TAX_INFORMATION_UPDATED = 'Supplier tax information updated successfully',
  SUPPLIER_TAX_INFORMATION_DELETION_SKIPPED = 'Supplier tax information deletion not supported - operation skipped',

  // General Error Messages
  RECORD_NOT_FOUND = 'Requested record not found in database',
  ORGANIZATION_ID_REQUIRED = 'Organization ID header is required and must be non-empty string',
  UNSUPPORTED_TABLE_NAME = 'Unsupported IFS table name',
  INVALID_SYNCHRONIZATION_ACTION = 'Invalid synchronization action',
  INVALID_JSON_PAYLOAD = 'Invalid JSON payload format',
  
  // Database Error Messages
  DUPLICATE_RECORD_VIOLATION = 'Duplicate record constraint violation',
  FOREIGN_KEY_CONSTRAINT_VIOLATION = 'Foreign key constraint violation',
  DATABASE_OPERATION_VALIDATION_FAILED = 'Database operation validation failed',
  DATABASE_SCHEMA_VALIDATION_FAILED = 'Database schema validation failed',
  DATABASE_CONNECTION_INITIALIZATION_FAILED = 'Database connection initialization failed',
  UNKNOWN_DATABASE_OPERATION_ERROR = 'Unknown database operation error',
  
  // Server Error Messages
  INTERNAL_SERVER_ERROR = 'Internal server error during IFS table synchronization'
}