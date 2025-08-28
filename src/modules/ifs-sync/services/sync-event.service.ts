import { EventEmitter } from 'events';
import { SyncEvent } from '../../../common/interfaces/ifs.interface';
import { NxinvoiceSyncService } from '../../nxinvoice-sync/services/nxinvoice-sync.service';

export class SyncEventService {
  private eventEmitter = new EventEmitter();
  private eventQueue: SyncEvent[] = [];
  private processing = false;
  private nxinvoiceSyncService = new NxinvoiceSyncService();

  // Table sync handlers mapping
  private syncHandlers = {
    'supplier_info_tab': (organizationId: string, rowkey: string) =>
      this.nxinvoiceSyncService.syncSupplier(organizationId, rowkey),
    'payment_address_tab': (organizationId: string, rowkey: string) =>
      this.nxinvoiceSyncService.syncPaymentAddress(organizationId, rowkey),
    'supplier_document_tax_info_tab': (organizationId: string, rowkey: string) =>
      this.nxinvoiceSyncService.syncSupplierDocumentTax(organizationId, rowkey)
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
      const syncHandler = this.syncHandlers[event.tableName as keyof typeof this.syncHandlers];

      if (!syncHandler) {
        console.error(`No sync handler for table: ${event.tableName}`);
        return;
      }

      await syncHandler(event.organizationId, event.rowkey);
    } catch (error) {
      console.error(`NXInvoice sync failed for ${event.tableName}/${event.rowkey}:`, error);
      // Don't throw - we don't want to break the IFS sync if NXInvoice sync fails
    }
  }
}
