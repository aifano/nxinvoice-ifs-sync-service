import { PrismaClient } from '@prisma/client';
import { IfsTableSynchronizationHandler, IfsTableSynchronizationHandlerFactory as IIfsTableSynchronizationHandlerFactory } from '../types/ifs-table-handler';
import { IfsSupplierInformationSynchronizationHandler } from './table-handlers/ifs-supplier-information-synchronization-handler';
import { IfsPaymentAddressSynchronizationHandler } from './table-handlers/ifs-payment-address-synchronization-handler';
import { IfsSupplierDocumentTaxSynchronizationHandler } from './table-handlers/ifs-supplier-document-tax-synchronization-handler';
import { OrganizationContextJsonLogger } from '../utilities/organization-context-json-logger';

export class IfsTableSynchronizationHandlerFactory implements IIfsTableSynchronizationHandlerFactory {
  private registeredTableSynchronizationHandlers: Map<string, new (prismaClient: PrismaClient) => IfsTableSynchronizationHandler>;

  constructor(
    private prismaClientForDatabaseOperations: PrismaClient,
    private organizationContextLogger: OrganizationContextJsonLogger = new OrganizationContextJsonLogger()
  ) {
    this.registeredTableSynchronizationHandlers = new Map();

    this.registerDefaultIfsTableSynchronizationHandlers();
  }

  createTableSynchronizationHandler(ifsTableName: string): IfsTableSynchronizationHandler | null {
    const HandlerConstructor = this.registeredTableSynchronizationHandlers.get(ifsTableName);
    
    if (!HandlerConstructor) {
      this.organizationContextLogger.logWarningWithOrganizationContext(
        'system',
        `No synchronization handler found for IFS table: ${ifsTableName}`,
        { requestedIfsTableName: ifsTableName, availableTableNames: this.getAllSupportedIfsTableNames() }
      );
      return null;
    }

    try {
      const handlerInstance = new HandlerConstructor(this.prismaClientForDatabaseOperations);
      this.organizationContextLogger.logDebugInformationWithOrganizationContext(
        'system',
        `Successfully created synchronization handler for IFS table: ${ifsTableName}`,
        { ifsTableName, handlerClass: HandlerConstructor.name }
      );
      return handlerInstance;
    } catch (handlerCreationError) {
      this.organizationContextLogger.logErrorWithOrganizationContext(
        'system',
        `Failed to create synchronization handler for IFS table: ${ifsTableName}`,
        handlerCreationError as Error,
        { ifsTableName, handlerClass: HandlerConstructor.name }
      );
      return null;
    }
  }

  registerNewTableSynchronizationHandler(
    ifsTableName: string,
    handlerClass: new (prismaClient: PrismaClient) => IfsTableSynchronizationHandler
  ): void {
    if (this.registeredTableSynchronizationHandlers.has(ifsTableName)) {
      this.organizationContextLogger.logWarningWithOrganizationContext(
        'system',
        `Overwriting existing synchronization handler for IFS table: ${ifsTableName}`,
        { ifsTableName, existingHandler: true, newHandlerClass: handlerClass.name }
      );
    }

    this.registeredTableSynchronizationHandlers.set(ifsTableName, handlerClass);
    
    this.organizationContextLogger.logInformationWithOrganizationContext(
      'system',
      `Registered new synchronization handler for IFS table: ${ifsTableName}`,
      { ifsTableName, handlerClass: handlerClass.name, totalRegisteredHandlers: this.registeredTableSynchronizationHandlers.size }
    );
  }

  getAllSupportedIfsTableNames(): string[] {
    return Array.from(this.registeredTableSynchronizationHandlers.keys());
  }

  getNumberOfRegisteredHandlers(): number {
    return this.registeredTableSynchronizationHandlers.size;
  }

  isIfsTableSynchronizationSupported(ifsTableName: string): boolean {
    return this.registeredTableSynchronizationHandlers.has(ifsTableName);
  }

  private registerDefaultIfsTableSynchronizationHandlers(): void {
    // Register the three existing IFS table handlers
    this.registerNewTableSynchronizationHandler(
      'supplier_info_tab',
      IfsSupplierInformationSynchronizationHandler
    );
    
    this.registerNewTableSynchronizationHandler(
      'payment_address_tab',
      IfsPaymentAddressSynchronizationHandler
    );
    
    this.registerNewTableSynchronizationHandler(
      'supplier_document_tax_info_tab',
      IfsSupplierDocumentTaxSynchronizationHandler
    );

    this.organizationContextLogger.logInformationWithOrganizationContext(
      'system',
      'Default IFS table synchronization handlers registered successfully',
      { 
        registeredTableNames: this.getAllSupportedIfsTableNames(),
        totalHandlers: this.getNumberOfRegisteredHandlers()
      }
    );
  }
}