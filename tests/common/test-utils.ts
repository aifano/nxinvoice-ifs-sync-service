// General Test Utilities (not module-specific)

// Random String Generator
const generateRandomString = (length: number = 6) => {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};

// Random Data Generators
export const generateRandomId = () => `TEST_${Date.now()}_${generateRandomString(8)}`;
export const generateRandomName = () => `Company_${generateRandomString(6)}`;
export const generateRandomRowKey = () => `ROWKEY_${Date.now()}_${generateRandomString(8)}`;

// Supplier ID Generator: TEST_7{5 digits}
export const generateSupplierId = () => {
  const fiveDigits = Math.floor(10000 + Math.random() * 90000); // 5-digit number
  return `TEST_7${fiveDigits}`;
};

// Expectation Helpers
export const expectSuccessResponse = (response: any, expectedMessage?: string) => {
  expect(response.status).toBe(200);
  expect(response.data.success).toBe(true);
  if (expectedMessage) {
    expect(response.data.message).toContain(expectedMessage);
  }
};

export const expectErrorResponse = (response: any, expectedMessage?: string) => {
  expect(response.status).toBe(200); // HTTP 200 für Business-Logic-Fehler
  expect(response.data.success).toBe(false);
  if (expectedMessage) {
    expect(response.data.message).toContain(expectedMessage);
  }
};

// Separate function for Authentication/Authorization errors
export const expectAuthErrorResponse = (response: any, expectedStatus: number, expectedMessage?: string) => {
  expect(response.status).toBe(expectedStatus); // 401/403 für Auth-Fehler
  expect(response.data.success).toBe(false);
  if (expectedMessage) {
    expect(response.data.message).toContain(expectedMessage);
  }
};

// Sleep helper for timing tests
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
