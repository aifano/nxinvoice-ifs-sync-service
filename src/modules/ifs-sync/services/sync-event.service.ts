import { EventEmitter } from 'events';
import { SyncEvent } from '../../../common/interfaces/ifs.interface';
import { NxinvoiceSyncService } from '../../nxinvoice-sync/services/nxinvoice-sync.service';

export class SyncEventService {
  private eventEmitter = new EventEmitter();
  private eventQueue: SyncEvent[] = [];
  private processing = false;
  private nxinvoiceSyncService = new NxinvoiceSyncService();

  // Table sync handlers mapping for upsert operations
  private upsertHandlers = {
    'supplier_info_tab': (organizationId: string, rowkey: string) =>
      this.nxinvoiceSyncService.upsertSupplier(organizationId, rowkey),
    'payment_address_tab': (organizationId: string, rowkey: string) =>
      this.nxinvoiceSyncService.upsertPayment(organizationId, rowkey),
    'supplier_document_tax_info_tab': (organizationId: string, rowkey: string) =>
      this.nxinvoiceSyncService.upsertTax(organizationId, rowkey)
  };

  // Table sync handlers mapping for delete operations
  private deleteHandlers = {
    'supplier_info_tab': (organizationId: string, rowkey: string) =>
      this.nxinvoiceSyncService.deleteSupplier(organizationId, rowkey),
    'payment_address_tab': (organizationId: string, rowkey: string) =>
      this.nxinvoiceSyncService.deletePayment(organizationId, rowkey),
    'supplier_document_tax_info_tab': (organizationId: string, rowkey: string) =>
      this.nxinvoiceSyncService.deleteTax(organizationId, rowkey)
  };

  constructor() {
    // Register event handlers
    this.setupEventHandlers();
  }

  emitSyncEvent(event: SyncEvent) {
    this.eventQueue.push(event);
    this.eventEmitter.emit('syncEvent', event);
    
    // Process queue if not already processing
    if (!this.processing) {
      this.processQueue();
    }
  }

  onSyncEvent(handler: (event: SyncEvent) => Promise<void>) {
    this.eventEmitter.on('syncEvent', handler);
  }

  private setupEventHandlers() {
    this.onSyncEvent(async (event) => {
      try {
        await this.performDatabaseSync(event);
      } catch (error) {
        console.error(`Sync event failed: ${event.tableName}/${event.rowkey}`, error);
      }
    });
  }

  private async processQueue() {
    this.processing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        try {
          await this.performDatabaseSync(event);
        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
    }

    this.processing = false;
  }

  private async performDatabaseSync(event: SyncEvent): Promise<void> {
    try {
      let syncHandler: ((organizationId: string, rowkey: string) => Promise<void>) | undefined;

      // Choose the appropriate handler based on operation type
      if (event.operation === 'delete') {
        syncHandler = this.deleteHandlers[event.tableName as keyof typeof this.deleteHandlers];
      } else {
        // For upsert, insert, update operations, use upsert handlers
        syncHandler = this.upsertHandlers[event.tableName as keyof typeof this.upsertHandlers];
      }

      if (!syncHandler) {
        console.error(`No sync handler for table: ${event.tableName}, operation: ${event.operation}`);
        return;
      }

      console.log(`NXInvoice sync - Processing ${event.operation} for ${event.tableName}/${event.rowkey}`);
      await syncHandler(event.organizationId, event.rowkey);
    } catch (error) {
      console.error(`NXInvoice sync failed for ${event.tableName}/${event.rowkey} (${event.operation}):`, error);
      // Don't throw - we don't want to break the IFS sync if NXInvoice sync fails
    }
  }
}
