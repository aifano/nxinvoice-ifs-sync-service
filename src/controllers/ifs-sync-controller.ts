import { Request, Response } from 'express';
import { IfsTableSynchronizationService } from '../services/ifs-sync-service';
import { IfsTableSynchronizationResponse } from '../types/ifs-table-synchronization';

export class IfsSyncController {

  constructor(private syncService: IfsTableSynchronizationService) {}

  async handleSynchronizationRequest(httpRequest: Request, httpResponse: Response): Promise<void> {
    // 1. Extract arguments from header and parameters
    const { action, data } = httpRequest.body;
    const tableName = httpRequest.params.table;
    const organizationId = (httpRequest as any).orgId;

    // 2. Always return HTTP status 200
    try {
      // 3. Validate required fields
      if (!organizationId) {
        const response: IfsTableSynchronizationResponse = {
          status: 400,
          message: 'Organization ID is required',
          success: false
        };
        httpResponse.status(200).json(response);
        return;
      }

      if (!tableName || !action) {
        const response: IfsTableSynchronizationResponse = {
          status: 400,
          message: 'Table name and action are required',
          success: false
        };
        httpResponse.status(200).json(response);
        return;
      }

      // 4. Pass to IFS-Sync Service
      const result = await this.syncService.synchronizeTableData(
        tableName,
        action,
        organizationId,
        data
      );

      // 5. Always return 200 with result in JSON
      const response: IfsTableSynchronizationResponse = {
        status: result.status,
        message: result.message,
        success: result.success
      };

      httpResponse.status(200).json(response);

    } catch (error) {
      // Even for unexpected errors, return 200 with error in JSON
      const response: IfsTableSynchronizationResponse = {
        status: 500,
        message: 'Internal server error occurred',
        success: false
      };

      httpResponse.status(200).json(response);
    }
  }

}
