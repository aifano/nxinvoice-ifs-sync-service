import { SyncEvent } from '../../../common/interfaces/ifs.interface';
import { NxinvoiceSyncService } from '../../nxinvoice-sync/services/nxinvoice-sync.service';

export class SyncEventService {
  private nxinvoiceSyncService = new NxinvoiceSyncService();

  // Table sync handlers mapping for upsert operations
  private upsertHandlers = {
    'supplier_info_tab': (organizationId: string, rowkey: string, changes: any) =>
      this.nxinvoiceSyncService.upsertSupplier(organizationId, rowkey, changes),
    'payment_address_tab': (organizationId: string, rowkey: string, changes: any) =>
      this.nxinvoiceSyncService.upsertPayment(organizationId, rowkey, changes),
    'supplier_document_tax_info_tab': (organizationId: string, rowkey: string, changes: any) =>
      this.nxinvoiceSyncService.upsertTax(organizationId, rowkey, changes)
  };

  // Table sync handlers mapping for delete operations
  private deleteHandlers = {
    'supplier_info_tab': (organizationId: string, rowkey: string, changes: any) =>
      this.nxinvoiceSyncService.deleteSupplier(organizationId, rowkey, changes),
    'payment_address_tab': (organizationId: string, rowkey: string, changes: any) =>
      this.nxinvoiceSyncService.deletePayment(organizationId, rowkey, changes),
    'supplier_document_tax_info_tab': (organizationId: string, rowkey: string, changes: any) =>
      this.nxinvoiceSyncService.deleteTax(organizationId, rowkey, changes)
  };

  public async performDatabaseSync(event: SyncEvent): Promise<void> {
    try {
      let syncHandler: ((organizationId: string, rowkey: string, changes: any) => Promise<void>) | undefined;

      // Choose the appropriate handler based on operation type
      if (event.operation === 'delete') {
        syncHandler = this.deleteHandlers[event.tableName as keyof typeof this.deleteHandlers];
      } else {
        syncHandler = this.upsertHandlers[event.tableName as keyof typeof this.upsertHandlers];
      }

      if (!syncHandler) {
        console.error(`No sync handler for table: ${event.tableName}, operation: ${event.operation}`);
        return;
      }

      await syncHandler(event.organizationId, event.rowkey, event.data);
    } catch (error) {
      console.error(`NXInvoice sync failed for ${event.tableName}/${event.rowkey} (${event.operation}):`, error);
      // Don't throw - we don't want to break the IFS sync if NXInvoice sync fails
    }
  }
}
