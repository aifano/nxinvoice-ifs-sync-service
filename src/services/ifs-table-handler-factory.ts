import { PrismaClient } from '@prisma/client';
import { IfsTableHandler } from '../types/ifs-table-handler';
import { SupplierInformationHandler } from './handlers/supplier-information-handler';
import { PaymentAddressHandler } from './handlers/payment-address-handler';
import { SupplierDocumentTaxHandler } from './handlers/supplier-document-tax-handler';

export class IfsTableHandlerFactory {
  private handlers: Map<string, IfsTableHandler>;

  constructor() {
    this.handlers = new Map();
    this.setupHandlers();
  }

  getHandler(tableName: string): IfsTableHandler | null {
    return this.handlers.get(tableName) || null;
  }

  getSupportedTableNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  private setupHandlers(): void {
    // Register all supported table handlers
    this.handlers.set('supplier_info_tab', new SupplierInformationHandler());
    this.handlers.set('payment_address_tab', new PaymentAddressHandler());
    this.handlers.set('supplier_document_tax_info_tab', new SupplierDocumentTaxHandler());
  }
}
