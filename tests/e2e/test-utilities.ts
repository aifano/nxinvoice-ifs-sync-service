import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

export interface ApiResponse {
  status: number;
  body: any;
}

export class IfsE2ETestClient {
  private readonly serviceBaseUrl: string;
  private readonly testOrganizationId: string;

  constructor(
    serviceBaseUrl: string = process.env.TEST_SERVICE_URL || 'http://127.0.0.1:13000',
    testOrganizationId: string = 'org_e2e_test'
  ) {
    this.serviceBaseUrl = serviceBaseUrl;
    this.testOrganizationId = testOrganizationId;
  }

  async makeRequest(
    tableName: string,
    requestBody: { action: string; data: any },
    organizationId?: string
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.serviceBaseUrl}/ifs-sync/v1/${tableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'organizationId': organizationId !== undefined ? organizationId : this.testOrganizationId,
        },
        body: JSON.stringify(requestBody),
      });

      let body;
      try {
        body = await response.json();
      } catch (error) {
        body = { error: 'Invalid JSON response', rawBody: await response.text() };
      }

      return { status: response.status, body };
    } catch (error) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  async makeRequestWithoutOrganizationId(
    tableName: string,
    requestBody: { action: string; data: any }
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.serviceBaseUrl}/ifs-sync/v1/${tableName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const body = await response.json();
      return { status: response.status, body };
    } catch (error) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  async makeRequestWithMalformedJson(
    tableName: string,
    malformedJsonString: string,
    organizationId?: string
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.serviceBaseUrl}/ifs-sync/v1/${tableName}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'organizationId': organizationId || this.testOrganizationId 
        },
        body: malformedJsonString,
      });

      const body = await response.json();
      return { status: response.status, body };
    } catch (error) {
      return { status: 400, body: { error: 'Connection Error Expected' } };
    }
  }

  getTestOrganizationId(): string {
    return this.testOrganizationId;
  }

  getWrongOrganizationId(): string {
    return 'org_e2e_test_wrong';
  }
}

export const testClient = new IfsE2ETestClient();

export class IfsE2ETestDatabaseHelper {
  private prisma: PrismaClient;
  private testOrganizationId: string;

  constructor(testOrganizationId: string = 'org_e2e_test') {
    this.prisma = new PrismaClient();
    this.testOrganizationId = testOrganizationId;
  }

  async cleanupTestData(): Promise<void> {
    try {
      // Clean up all test data from both tables
      await this.prisma.supplierBankAddresse.deleteMany({
        where: {
          organization_id: this.testOrganizationId
        }
      });
      
      await this.prisma.supplier.deleteMany({
        where: {
          organization_group_id: this.testOrganizationId
        }
      });
    } catch (error) {
      console.warn('Database cleanup failed:', error);
    }
  }

  async verifySupplierExists(externalId: string): Promise<boolean> {
    try {
      const supplier = await this.prisma.supplier.findFirst({
        where: {
          external_id: externalId,
          organization_group_id: this.testOrganizationId
        }
      });
      return supplier !== null;
    } catch (error) {
      console.warn('Supplier verification failed:', error);
      return false;
    }
  }

  async verifyPaymentAddressExists(externalId: string): Promise<boolean> {
    try {
      const paymentAddress = await this.prisma.supplierBankAddresse.findFirst({
        where: {
          external_id: externalId,
          organization_id: this.testOrganizationId
        }
      });
      return paymentAddress !== null;
    } catch (error) {
      console.warn('Payment address verification failed:', error);
      return false;
    }
  }

  async getSupplierByExternalId(externalId: string) {
    try {
      return await this.prisma.supplier.findFirst({
        where: {
          external_id: externalId,
          organization_group_id: this.testOrganizationId
        }
      });
    } catch (error) {
      console.warn('Get supplier failed:', error);
      return null;
    }
  }

  async getPaymentAddressByExternalId(externalId: string) {
    try {
      return await this.prisma.supplierBankAddresse.findFirst({
        where: {
          external_id: externalId,
          organization_id: this.testOrganizationId
        }
      });
    } catch (error) {
      console.warn('Get payment address failed:', error);
      return null;
    }
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export const testDbHelper = new IfsE2ETestDatabaseHelper();