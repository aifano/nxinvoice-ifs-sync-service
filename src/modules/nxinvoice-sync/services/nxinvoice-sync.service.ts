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
  async upsertSupplier(organizationId: string, rowkey: string, changes: any): Promise<void> {
    try {
      const supplier = await this.nxinvoiceSyncPrismaClient.supplier.findFirst({
        where: {
          organization_group_id: organizationId,
          OR: [
            {
              supplier_id: changes?.supplier_id
            },
            {
              external_id: changes?.rowkey
            }
          ]
        }
      });

      if (!supplier) {
        await this.nxinvoiceSyncPrismaClient.supplier.create({
          data: {
            supplier_id: changes?.supplier_id,
            organization_group_id: organizationId,
            external_id: changes?.rowkey,

            name: changes?.name,
            vat_id: changes?.association_no,
            tax_id: changes?.association_no
          }
        });
        return;
      }

      const data = {} as {[key: string]: string};
      if (!supplier.vat_id && changes?.association_no) {
        data.tax_id = changes?.association_no;
        data.vat_id = changes?.association_no;
      }

      await this.nxinvoiceSyncPrismaClient.supplier.update({
        where: {
          id: supplier.id
        },
        data: {
          ...data,
          name: changes?.name
        }
      });
    } catch (error) {
      console.error(`NXInvoice - Supplier upsert failed: ${organizationId}/${rowkey}`, error);
      throw error;
    }
  }

  async deleteSupplier(organizationId: string, rowkey: string, changes?: any): Promise<void> {
    try {
      const supplier = await this.nxinvoiceSyncPrismaClient.supplier.findFirst({
        where: {
          organization_group_id: organizationId,
          OR: [
            {
              supplier_id: changes?.supplier_id
            },
            {
              external_id: changes?.rowkey
            }
          ]
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
  async upsertPayment(organizationId: string, rowkey: string, changes?: any): Promise<void> {
    try {
      const payment = await this.nxinvoiceSyncPrismaClient.supplierBankAddresse.findFirst({
        where: {
          organization_id: organizationId,
          OR: [
            {
              supplier_id: changes?.identity
            },
            {
              external_id: changes?.rowkey
            }
          ]
        }
      });

      if (!payment) {
        await this.nxinvoiceSyncPrismaClient.supplierBankAddresse.create({
          data: {
            organization_id: organizationId,
            supplier_id: changes?.identity,
            external_id: changes?.rowkey,

            tenant_id: changes?.tenant_id || '',
            supplier_name: changes?.supplier_name,
            bank_name: changes?.bank_name,
            iban: changes?.account,
            bic: changes?.bic_code,
            is_default: changes?.default_address === '1',
            blocked_for_use: changes?.blocked_for_use === '1',
            way_id: changes?.way_id,
            address_id: changes?.address_id
          }
        });
        return;
      }

      await this.nxinvoiceSyncPrismaClient.supplierBankAddresse.update({
        where: {
          id: payment.id
        },
        data: {
          tenant_id: changes?.tenant_id || '',
          supplier_name: changes?.supplier_name,
          bank_name: changes?.bank_name,
          iban: changes?.account,
          bic: changes?.bic_code,
          is_default: changes?.default_address === '1',
          blocked_for_use: changes?.blocked_for_use === '1',
          way_id: changes?.way_id,
          address_id: changes?.address_id
        }
      });
    } catch (error) {
      console.error(`NXInvoice - Payment upsert failed: ${organizationId}/${rowkey}`, error);
      throw error;
    }
  }

  async deletePayment(organizationId: string, rowkey: string, changes?: any): Promise<void> {
    try {
      const payment = await this.nxinvoiceSyncPrismaClient.supplierBankAddresse.findFirst({
        where: {
          organization_id: organizationId,
          OR: [
            {
              supplier_id: changes?.identity
            },
            {
              external_id: changes?.rowkey
            }
          ]
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
  async upsertTax(organizationId: string, rowkey: string, changes?: any): Promise<void> {
    try {
      const supplier = await this.nxinvoiceSyncPrismaClient.supplier.findFirst({
        where: {
          organization_group_id: organizationId,
          OR: [
            {
              supplier_id: changes?.supplier_id
            },
            {
              external_id: changes?.rowkey
            }
          ]
        }
      });

      if (!supplier) {
        return;
      }

      await this.nxinvoiceSyncPrismaClient.supplier.update({
        where: {
          id: supplier.id
        },
        data: {
          tax_id: changes?.tax_id,
          vat_id: changes?.vat_id
        }
      });
    } catch (error) {
      console.error(`NXInvoice - Tax upsert failed: ${organizationId}/${rowkey}`, error);
      throw error;
    }
  }

  async deleteTax(organizationId: string, rowkey: string, changes?: any): Promise<void> {
    try {
      const supplier = await this.nxinvoiceSyncPrismaClient.supplier.findFirst({
        where: {
          organization_group_id: organizationId,
          OR: [
            {
              supplier_id: changes.supplier_id
            },
            {
              external_id: changes.rowkey
            }
          ]
        }
      });

      if (!supplier) {
        console.log(`NXInvoice - Supplier not found for tax delete: ${organizationId}/${rowkey}`);
        return;
      }

      const tax = await this.ifsSyncPrismaClient.iFS_Supplier_Document_Tax.findFirst({
        where: {
          organization_id: organizationId,
          supplier_id: changes.supplier_id
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
          tax_id: tax?.vat_no || null,
          vat_id: tax?.vat_no || null
        }
      });
    } catch (error) {
      console.error(`NXInvoice - Tax delete failed: ${organizationId}/${rowkey}`, error);
      throw error;
    }
  }
}
