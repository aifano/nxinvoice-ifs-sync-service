import { Request, Response } from 'express';
import { IfsSyncService } from '../services/ifs-sync.service';
import { SyncEventService } from '../services/sync-event.service';
import { PrismaClient } from '@prisma/client';
import { IfsResponse } from '../../../common/interfaces/ifs.interface';

export class IfsSyncController {
  private service: IfsSyncService;
  private syncEventService: SyncEventService;

  constructor(prisma?: PrismaClient) {
    this.service = new IfsSyncService(prisma);
    this.syncEventService = new SyncEventService();
  }

  async handleRequest(req: Request, res: Response, table: string): Promise<void> {
    const startTime = Date.now();
    const { action, data } = req.body;
    const organizationId = (req as any).organizationId;

    try {
      // No validation - process all requests
      const result = await this.service.processData(table, action, data, organizationId);

      // Emit sync event if successful
      if (result.success && data?.rowkey) {
        this.syncEventService.emitSyncEvent({
          organizationId,
          tableName: table,
          rowkey: data.rowkey,
          operation: action,
          timestamp: new Date(),
          data,
          previousData: (result as any).previousData
        });
      }

      // Log and respond
      this.logRequest(req, result, startTime);

      // Remove error field and previousData before sending to client
      const clientResponse = { ...result };
      delete clientResponse.error;
      delete (clientResponse as any).previousData;

      res.status(200).json(clientResponse);

    } catch (error) {
      const result: IfsResponse = {
        message: 'Internal server error',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
      this.logRequest(req, result, startTime);

      // Remove error field before sending to client
      const clientResponse = { ...result };
      delete clientResponse.error;

      res.status(200).json(clientResponse);
    }
  }

  private logRequest(req: Request, result: IfsResponse, startTime: number) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      organizationId: (req as any).organizationId,
      table: req.params.table || req.url.split('/')[1],
      request: {
        action: req.body?.action,
        data: req.body?.data
      },
      response: result,
      duration: Date.now() - startTime
    };
    console.log(JSON.stringify(logEntry));
  }
}
