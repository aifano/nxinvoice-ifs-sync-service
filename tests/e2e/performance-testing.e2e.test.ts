import { testClient, testDbHelper } from './test-utilities';
import { IfsTableSynchronizationResponseMessage } from '../../src/types/ifs-table-synchronization-response-messages';

describe('Performance and Load Testing - E2E Tests', () => {
  // Cleanup nach jedem Test
  afterEach(async () => {
    await testDbHelper.cleanupTestData();
  });

  // Cleanup nach allen Tests
  afterAll(async () => {
    await testDbHelper.disconnect();
  });

  describe('Response Time and Load Tests', () => {
    it('Antwortzeit unter Last', async () => {
      const startTime = Date.now();
      
      const response = await testClient.makeRequest('supplier_info_tab', {
        action: 'insert',
        data: {
          supplier_id: 'PERFORMANCE_TEST',
          name: 'Performance Test Supplier',
          rowkey: 'performance_test_key',
        },
      });

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_CREATED);
      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(2000); // Unter 2 Sekunden
    });

    it('Mehrere parallele Requests', async () => {
      const requests = Array.from({ length: 5 }, (_, index) => 
        testClient.makeRequest('supplier_info_tab', {
          action: 'insert',
          data: {
            supplier_id: `PARALLEL_SUPPLIER_${index}`,
            name: `Parallel Test Supplier ${index}`,
            rowkey: `parallel_key_${index}`,
          },
        })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe(IfsTableSynchronizationResponseMessage.SUPPLIER_INFORMATION_CREATED);
      });
    });
  });
});