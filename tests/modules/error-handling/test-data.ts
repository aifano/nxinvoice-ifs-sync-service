// Error Handling Module - Test Data for Error Scenarios
import jwt from 'jsonwebtoken';
import { TEST_CONFIG } from '../../common/test-config';
import { generateSupplierId, generateCompanyId, generateAddressId, generateRowKey } from '../ifs-sync/test-data';

// Random String Generator
const generateRandomString = (length: number = 6) => {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};

const getRandomCountryCode = () => {
  const countries = ['DE', 'GB', 'FR', 'IT', 'ES', 'AT'];
  return countries[Math.floor(Math.random() * countries.length)];
};

const generateRandomWords = (count: number) => {
  const words = ['test', 'data', 'sample', 'random', 'value', 'field', 'content', 'info'];
  return Array.from({ length: count }, () => words[Math.floor(Math.random() * words.length)]).join(' ');
};

const generateRandomNumber = (min: number, max: number) => {
  return Math.floor(min + Math.random() * (max - min));
};

const generateRandomFloat = (min: number, max: number, decimals: number = 2) => {
  return parseFloat((min + Math.random() * (max - min)).toFixed(decimals));
};

// Invalid JWT Token Generators
export const createExpiredToken = (orgId: string = TEST_CONFIG.TEST_ORG_ID): string => {
  const expiredPayload = {
    iss: 'api.nxinvoice.dev',
    org: { id: orgId },
    iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    exp: Math.floor(Date.now() / 1000) - 1800  // 30 minutes ago (expired)
  };
  return jwt.sign(expiredPayload, TEST_CONFIG.JWT_SECRET);
};

export const createTokenWithoutOrgId = (): string => {
  const invalidPayload = {
    iss: 'api.nxinvoice.dev',
    // Missing org.id
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  return jwt.sign(invalidPayload, TEST_CONFIG.JWT_SECRET);
};

export const createTokenWithWrongSecret = (orgId: string = TEST_CONFIG.TEST_ORG_ID): string => {
  const payload = {
    iss: 'api.nxinvoice.dev',
    org: { id: orgId },
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  return jwt.sign(payload, 'wrong_secret');
};

// Malformed JSON Test Data
export const MALFORMED_JSON_SAMPLES = {
  missingClosingBrace: '{"action": "upsert", "data": {"supplier_id": "TEST", "name": "Test"',
  trailingComma: '{"action": "upsert", "data": {"supplier_id": "TEST", "name": "Test",}}',
  singleQuotes: "{'action': 'upsert', 'data': {'supplier_id': 'TEST', 'name': 'Test'}}",
  unescapedQuotes: '{"action": "upsert", "data": {"supplier_id": "TEST", "name": "Test "Company" Name"}}'
};

// Invalid Data Structures
export const INVALID_DATA_TYPES = {
  numberAsString: {
    supplier_id: generateRandomNumber(10000, 99999), // Number instead of string
    name: generateRandomNumber(10000, 99999), // Number instead of string
    rowkey: generateRowKey(),
    country: generateRandomNumber(100, 999), // Number instead of string
    party_type: Math.random() > 0.5 // Boolean instead of string
  },
  arrayValues: {
    company: ['word1', 'word2'],
    supplier_id: { object: 'value' },
    address_id: generateAddressId(),
    rowkey: generateRowKey(),
    vat_no: [123, 456, 789]
  },
  nullAndUndefined: {
    company: null,
    identity: undefined,
    address_id: null,
    rowkey: generateRowKey(),
    account: undefined,
    bic_code: generateRandomNumber(0, 9)
  }
};

// Case Sensitivity Test Data
export const UPPERCASE_FIELDS = {
  supplier: {
    SUPPLIER_ID: generateSupplierId(), // Uppercase
    NAME: `Company_${generateRandomString(6)}`, // Uppercase
    ROWKEY: generateRowKey(), // Uppercase
    COUNTRY: getRandomCountryCode(), // Uppercase
    PARTY_TYPE: 'ORGANIZATION' // Uppercase
  },
  payment: {
    Company: generateCompanyId(), // Mixed case
    Identity: generateSupplierId(), // Mixed case
    Address_Id: generateAddressId(), // Mixed case
    RowKey: generateRowKey(), // Mixed case
    Account: `DE89370400440532${generateRandomNumber(100000, 999999)}`, // Mixed case
    Bic_Code: `DEUT${getRandomCountryCode()}FF123` // Mixed case
  }
};

// Unknown Fields Test Data
export const DATA_WITH_UNKNOWN_FIELDS = {
  supplier: {
    supplier_id: generateSupplierId(),
    name: `Company_${generateRandomString(6)}`,
    rowkey: generateRowKey(),
    unknown_field_1: generateRandomWords(3),
    random_data: { nested: generateRandomString(4) },
    numeric_field: generateRandomNumber(1000, 99999),
    boolean_field: Math.random() > 0.5,
    array_field: [1, 2, 3],
    null_field: null,
    undefined_field: undefined
  },
  payment: {
    company: generateCompanyId(),
    identity: generateSupplierId(),
    address_id: generateAddressId(),
    rowkey: generateRowKey(),
    extra_payment_field: generateRandomWords(2),
    payment_metadata: { type: generateRandomString(4) },
    payment_amount: generateRandomFloat(100, 10000, 2)
  },
  tax: {
    company: generateCompanyId(),
    supplier_id: generateSupplierId(),
    address_id: generateAddressId(),
    rowkey: generateRowKey(),
    vat_no: `DE${generateRandomNumber(100000000, 999999999)}`,
    tax_calculation: Math.random() > 0.5 ? 'automatic' : 'manual',
    tax_rate: generateRandomFloat(0, 25, 2),
    tax_metadata: { region: ['EU', 'US', 'APAC'][Math.floor(Math.random() * 3)] }
  }
};

// Large Data for Stress Testing
export const createLargeDataPayload = () => ({
  action: 'upsert',
  data: {
    supplier_id: generateSupplierId(),
    name: generateRandomWords(2000), // Very long name
    rowkey: generateRowKey(),
    large_field: generateRandomWords(1000), // Very large field
    country: getRandomCountryCode(),
    description: generateRandomWords(500),
    notes: generateRandomWords(1000),
    metadata: JSON.stringify({
      created_by: `User_${generateRandomString(6)}`,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      tags: ['important', 'urgent', 'review'],
      large_array: Array.from({ length: 1000 }, () => generateRandomString(4))
    })
  }
});
