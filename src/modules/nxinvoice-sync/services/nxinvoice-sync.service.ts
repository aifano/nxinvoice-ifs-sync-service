import { PrismaClient as NxinvoiceSyncPrismaClient } from '@prisma/nxinvoice_sync_client';
import { PrismaClient as IfsSyncPrismaClient } from '@prisma/ifs_sync_client';

export class NxinvoiceSyncService {
  private nxinvoiceSyncPrismaClient: NxinvoiceSyncPrismaClient;
  private ifsSyncPrismaClient: IfsSyncPrismaClient;

  constructor() {
    this.nxinvoiceSyncPrismaClient = new NxinvoiceSyncPrismaClient();
    this.ifsSyncPrismaClient = new IfsSyncPrismaClient();
  }

  // Supplier operations
  async upsertSupplier(organizationId: string, rowkey: string, previousData?: any, changes?: any): Promise<void> {
    try {
      const supplier = await this.nxinvoiceSyncPrismaClient.supplier.findFirst({
        where: {
          organization_group_id: organizationId,
          supplier_id: changes.supplier_id
        }
      });

      if (!supplier) {
        console.log(`NXInvoice - Supplier not found for upsert: ${organizationId}/${rowkey}`);
        return;
      }

      await this.nxinvoiceSyncPrismaClient.supplier.update({
        where: {
          id: supplier.id
        },
        data: {
          name: changes.name
        }
      });
    } catch (error) {
      console.error(`NXInvoice - Supplier upsert failed: ${organizationId}/${rowkey}`, error);
      throw error;
    }
  }

  async deleteSupplier(organizationId: string, rowkey: string, previousData?: any, changes?: any): Promise<void> {
    try {
      const supplier = await this.nxinvoiceSyncPrismaClient.supplier.findFirst({
        where: {
          organization_group_id: organizationId,
          supplier_id: previousData.supplier_id
        }
      });

      if (!supplier) {
        console.log(`NXInvoice - Supplier not found for delete: ${organizationId}/${rowkey}`);
        return;
      }

      await this.nxinvoiceSyncPrismaClient.supplier.delete({
        where: {
          id: supplier.id
        }
      });
    } catch (error) {
      console.error(`NXInvoice - Supplier delete failed: ${organizationId}/${rowkey}`, error);
      throw error;
    }
  }

  // Payment operations
  async upsertPayment(organizationId: string, rowkey: string, previousData?: any, changes?: any): Promise<void> {
    try {
      const payment = await this.nxinvoiceSyncPrismaClient.supplierBankAddresse.findFirst({
        where: {
          organization_id: organizationId,
          supplier_id: previousData.identity
        }
      });

      if (!payment) {
        console.log(`NXInvoice - Payment not found for upsert: ${organizationId}/${rowkey}`);
        return;
      }

      await this.nxinvoiceSyncPrismaClient.supplierBankAddresse.update({
        where: {
          id: payment.id
        },
        data: {
          tenant_id: changes.tenant_id,
          supplier_name: changes.data10,
          bank_name: changes.description,
          iban: changes.account,
          bic: changes.bic_code,
          is_default: changes.default_address === '1',
          blocked_for_use: changes.blocked_for_use === '1',
          way_id: changes.way_id,
          address_id: changes.address_id
        }
      });
    } catch (error) {
      console.error(`NXInvoice - Payment upsert failed: ${organizationId}/${rowkey}`, error);
      throw error;
    }
  }

  async deletePayment(organizationId: string, rowkey: string, previousData?: any, changes?: any): Promise<void> {
    try {
      const payment = await this.nxinvoiceSyncPrismaClient.supplierBankAddresse.findFirst({
        where: {
          organization_id: organizationId,
          supplier_id: previousData.identity
        }
      });

      if (!payment) {
        console.log(`NXInvoice - Payment not found for delete: ${organizationId}/${rowkey}`);
        return;
      }

      await this.nxinvoiceSyncPrismaClient.supplierBankAddresse.delete({
        where: {
          id: payment.id
        }
      });
    } catch (error) {
      console.error(`NXInvoice - Payment delete failed: ${organizationId}/${rowkey}`, error);
      throw error;
    }
  }

  // Tax operations
  async upsertTax(organizationId: string, rowkey: string, previousData?: any, changes?: any): Promise<void> {
    try {
      const supplier = await this.nxinvoiceSyncPrismaClient.supplier.findFirst({
        where: {
          organization_group_id: organizationId,
          supplier_id: previousData.supplier_id
        }
      });

      if (!supplier) {
        console.log(`NXInvoice - Supplier not found for tax delete: ${organizationId}/${rowkey}`);
        return;
      }

      const tax = await this.ifsSyncPrismaClient.iFS_Supplier_Document_Tax.findFirst({
        where: {
          organization_id: organizationId,
          supplier_id: supplier.id
        },
        orderBy: {
          updated_at: 'desc'
        }
      });

      await this.nxinvoiceSyncPrismaClient.supplier.update({
        where: {
          id: supplier.id
        },
        data: {
          tax_id: tax?.vat_no ? tax.vat_no : null
        }
      });
    } catch (error) {
      console.error(`NXInvoice - Tax upsert failed: ${organizationId}/${rowkey}`, error);
      throw error;
    }
  }

  async deleteTax(organizationId: string, rowkey: string, previousData?: any, changes?: any): Promise<void> {
    try {
      const supplier = await this.nxinvoiceSyncPrismaClient.supplier.findFirst({
        where: {
          organization_group_id: organizationId,
          supplier_id: previousData.supplier_id
        }
      });

      if (!supplier) {
        console.log(`NXInvoice - Supplier not found for tax delete: ${organizationId}/${rowkey}`);
        return;
      }

      const tax = await this.ifsSyncPrismaClient.iFS_Supplier_Document_Tax.findFirst({
        where: {
          organization_id: organizationId,
          supplier_id: supplier.id
        },
        orderBy: {
          updated_at: 'desc'
        }
      });

      await this.nxinvoiceSyncPrismaClient.supplier.update({
        where: {
          id: supplier.id
        },
        data: {
          tax_id: tax?.vat_no ? tax.vat_no : null
        }
      });
    } catch (error) {
      console.error(`NXInvoice - Tax delete failed: ${organizationId}/${rowkey}`, error);
      throw error;
    }
  }
}
