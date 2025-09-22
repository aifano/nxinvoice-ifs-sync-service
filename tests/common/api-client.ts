import axios from 'axios';
import { TEST_CONFIG, generateTestToken } from './test-config';

// Base API Request Helper
export const apiRequest = async (endpoint: string, data: any, orgId?: string) => {
  const token = generateTestToken(orgId);

  try {
    const response = await axios.post(`${TEST_CONFIG.BASE_URL}${endpoint}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: TEST_CONFIG.TIMEOUT
    });

    // Return only serializable data to avoid circular references
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    };
  } catch (error: any) {
    // Handle axios errors and return serializable data
    if (error.response) {
      return {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      };
    }
    throw error;
  }
};

// API Request Helper without Auth (for testing auth failures)
export const apiRequestNoAuth = async (endpoint: string, data: any) => {
  try {
    const response = await axios.post(`${TEST_CONFIG.BASE_URL}${endpoint}`, data, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: TEST_CONFIG.TIMEOUT
    });

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    };
  } catch (error: any) {
    if (error.response) {
      return {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      };
    }
    throw error;
  }
};

// API Request Helper with invalid token
export const apiRequestInvalidAuth = async (endpoint: string, data: any) => {
  try {
    const response = await axios.post(`${TEST_CONFIG.BASE_URL}${endpoint}`, data, {
      headers: {
        'Authorization': 'Bearer invalid_token_here',
        'Content-Type': 'application/json'
      },
      timeout: TEST_CONFIG.TIMEOUT
    });

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    };
  } catch (error: any) {
    if (error.response) {
      return {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      };
    }
    throw error;
  }
};

// GET Request Helper (for health checks, etc.)
export const apiGetRequest = async (endpoint: string) => {
  try {
    const response = await axios.get(`${TEST_CONFIG.BASE_URL}${endpoint}`, {
      timeout: TEST_CONFIG.TIMEOUT
    });

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    };
  } catch (error: any) {
    if (error.response) {
      return {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      };
    }
    throw error;
  }
};

// API Request Helper with custom token
export const apiRequestWithToken = async (endpoint: string, data: any, token: string) => {
  return await axios.post(`${TEST_CONFIG.BASE_URL}${endpoint}`, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    timeout: TEST_CONFIG.TIMEOUT
  });
};
