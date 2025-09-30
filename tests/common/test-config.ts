import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Global Test Configuration
export const TEST_CONFIG = {
  BASE_URL: 'http://localhost:13001',
  JWT_SECRET: process.env.JWT_SECRET || '',
  TEST_ORG_ID: 'org_e2e_test',
  TIMEOUT: 30000
};

// Generate JWT Token for tests (matching original format exactly)
export const generateTestToken = (orgId: string = TEST_CONFIG.TEST_ORG_ID): string => {
  const token = jwt.sign(
    {
      iss: 'api.nxinvoice.dev',
      org: {
        id: orgId
      }
    },
    TEST_CONFIG.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '5y'
    }
  );
  return token;
}
