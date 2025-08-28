// IFS Sync Module - Test Data Generators

// Random String Generator
const generateRandomString = (length: number = 6) => {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};

// Valid Test Data Generators
export const createSupplierData = (supplierId?: string, name?: string, rowkey?: string) => ({
  supplier_id: supplierId || generateSupplierId(),
  name: name || `Company_${generateRandomString(6)}`,
  rowkey: rowkey || generateRowKey(),
  country: getRandomCountryCode(),
  party_type: getRandomPartyType()
});

export const createPaymentData = (company?: string, identity?: string, addressId?: string, rowkey?: string) => ({
  company: company || generateCompanyId(),
  identity: identity || generateSupplierId(),
  address_id: addressId || generateAddressId(),
  rowkey: rowkey || generateRowKey(),
  account: generateIBAN(),
  bic_code: generateBIC()
});

export const createTaxData = (company?: string, supplierId?: string, addressId?: string, rowkey?: string) => ({
  company: company || generateCompanyId(),
  supplier_id: supplierId || generateSupplierId(),
  address_id: addressId || generateAddressId(),
  rowkey: rowkey || generateRowKey(),
  vat_no: generateVatNumber()
});

// Helper functions for ID generation
export const generateSupplierId = () => {
  const fiveDigits = Math.floor(10000 + Math.random() * 90000); // 5-digit number
  return `TEST_7${fiveDigits}`;
};

export const generateCompanyId = () => `COMP_${generateRandomString(8)}`;
export const generateAddressId = () => `ADDR_${generateRandomString(8)}`;
export const generateRowKey = () => `ROWKEY_${Date.now()}_${generateRandomString(8)}`;

// Random data generators
const getRandomCountryCode = () => {
  const countries = ['DE', 'GB', 'FR', 'IT', 'ES', 'AT', 'US', 'NL', 'BE'];
  return countries[Math.floor(Math.random() * countries.length)];
};

const getRandomPartyType = () => {
  const types = ['ORGANIZATION', 'PERSON'];
  return types[Math.floor(Math.random() * types.length)];
};

const generateIBAN = () => {
  const countryCode = 'DE';
  const checkDigits = Math.floor(10 + Math.random() * 90); // 2 digits
  const bankCode = Math.floor(10000000 + Math.random() * 90000000); // 8 digits
  const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000); // 10 digits
  return `${countryCode}${checkDigits}${bankCode}${accountNumber}`;
};

const generateBIC = () => {
  const bankCode = generateRandomString(4);
  const countryCode = getRandomCountryCode();
  const locationCode = generateRandomString(2);
  return `${bankCode}${countryCode}${locationCode}XXX`;
};

export const generateVatNumber = (countryCode?: string) => {
  const country = countryCode || getRandomCountryCode();
  const randomDigits = (length: number) => Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1));

  switch (country) {
    case 'DE': return `DE${randomDigits(9)}`;
    case 'GB': return `GB${randomDigits(9)}`;
    case 'FR': return `FR${randomDigits(11)}`;
    case 'IT': return `IT${randomDigits(11)}`;
    case 'ES': return `ES${randomDigits(8)}${generateRandomString(1)}`;
    case 'AT': return `AT${randomDigits(8)}`;
    default: return `DE${randomDigits(9)}`;
  }
};

// Invalid Data Generators for Error Testing
export const createInvalidSupplierData = () => ({
  SUPPLIER_ID: 'UPPERCASE_FIELD', // Wrong case
  invalid_field: 'should_not_exist',
  // missing rowkey
  name: 'Test Supplier'
});

export const createInvalidPaymentData = () => ({
  Company: 'UPPERCASE_FIELD', // Wrong case
  unknown_field: 'invalid',
  // missing rowkey
  identity: 'TEST_IDENTITY'
});

export const createInvalidTaxData = () => ({
  COMPANY: 'UPPERCASE_FIELD', // Wrong case
  extra_field: 'not_allowed',
  // missing rowkey
  supplier_id: 'TEST_SUPPLIER'
});

// Edge Case Data Generators
export const createSupplierDataWithSpecialChars = (supplierId?: string, rowkey?: string) => ({
  supplier_id: supplierId || generateSupplierId(),
  name: `Company_${generateRandomString(4)} & Co. "Special" Chars äöü @#$%`,
  rowkey: rowkey || generateRowKey(),
  country: getRandomCountryCode(),
  party_type: 'ORGANIZATION'
});

export const createSupplierDataWithLongValues = (supplierId?: string, rowkey?: string) => ({
  supplier_id: supplierId || generateSupplierId(),
  name: `VeryLongCompanyName_${generateRandomString(50)}_WithManyCharacters_${generateRandomString(50)}`, // Very long name
  rowkey: rowkey || generateRowKey(),
  country: getRandomCountryCode(),
  party_type: 'ORGANIZATION'
});

export const createPaymentDataWithDifferentFormats = (company?: string, identity?: string, addressId?: string, rowkey?: string) => ({
  company: company || generateCompanyId(),
  identity: identity || generateSupplierId(),
  address_id: addressId || generateAddressId(),
  rowkey: rowkey || generateRowKey(),
  account: `GB82WEST${Math.floor(10000000000000000 + Math.random() * 90000000000000000)}`, // GB IBAN format
  bic_code: `ABCD${getRandomCountryCode()}33XXX` // Different BIC format
});

export const createTaxDataWithDifferentVatFormats = (company?: string, supplierId?: string, addressId?: string, rowkey?: string, vatFormat?: string) => ({
  company: company || generateCompanyId(),
  supplier_id: supplierId || generateSupplierId(),
  address_id: addressId || generateAddressId(),
  rowkey: rowkey || generateRowKey(),
  vat_no: vatFormat || generateVatNumber()
});

// Common VAT number formats for testing
export const VAT_FORMATS = [
  'DE', 'GB', 'FR', 'IT', 'ES', 'AT'
].map(country => generateVatNumber(country));

// Realistic test data generators
export const createRealisticSupplierData = () => ({
  supplier_id: generateSupplierId(),
  name: faker.company.name(),
  rowkey: generateRowKey(),
  country: faker.location.countryCode(),
  party_type: faker.helpers.arrayElement(['ORGANIZATION', 'PERSON']),
  // Additional realistic fields
  address: faker.location.streetAddress(),
  city: faker.location.city(),
  postal_code: faker.location.zipCode(),
  phone: faker.phone.number(),
  email: faker.internet.email()
});

export const createRealisticPaymentData = () => ({
  company: generateCompanyId(),
  identity: generateSupplierId(),
  address_id: generateAddressId(),
  rowkey: generateRowKey(),
  account: faker.finance.iban({ formatted: false }),
  bic_code: faker.finance.bic(),
  // Additional realistic fields
  bank_name: faker.company.name() + ' Bank',
  account_holder: faker.person.fullName(),
  currency: faker.finance.currencyCode()
});

export const createRealisticTaxData = () => ({
  company: generateCompanyId(),
  supplier_id: generateSupplierId(),
  address_id: generateAddressId(),
  rowkey: generateRowKey(),
  vat_no: generateVatNumber(),
  // Additional realistic fields
  tax_rate: faker.number.float({ min: 0, max: 25, fractionDigits: 2 }),
  tax_exempt: faker.datatype.boolean(),
  registration_date: faker.date.past().toISOString().split('T')[0]
});
