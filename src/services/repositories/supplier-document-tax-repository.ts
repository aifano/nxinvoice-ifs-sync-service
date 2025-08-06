import { PrismaClient, Prisma } from '@prisma/client';
import { IFS_SupplierDocumentTaxInfoTab } from '../../types/ifs-supplier-document-tax-info-tab';

const prisma = new PrismaClient();

export const supplierDocumentTaxOps = {
    insert: async (data: IFS_SupplierDocumentTaxInfoTab, organizationId: string) => supplierDocumentTaxOps.update(data, organizationId),

    update: async (data: IFS_SupplierDocumentTaxInfoTab, organizationId: string) => {
        const supplier = await supplierDocumentTaxOps.__get_supplier(data, organizationId);

        if (!supplier) {
            throw new Error('Supplier not found');
        }

        return prisma.supplier.update({
            where: {
                id: supplier.id
            },
            data: {
                vat_id: data.vat_id || null,
                tax_id: data.tax_id || null,
            }
        });
    },

    upsert: async (data: IFS_SupplierDocumentTaxInfoTab, organizationId: string) => supplierDocumentTaxOps.update(data, organizationId),

    delete: (data: IFS_SupplierDocumentTaxInfoTab, organizationId: string) => Promise.resolve(),

    __get_supplier: async (data: IFS_SupplierDocumentTaxInfoTab, organizationId: string) => {
        if (!data.supplier_id) {
            throw new Error('Missing supplier_id');
        }

        const supplier = await prisma.supplier.findFirst({
            where: {
                organization_group_id: organizationId,
                supplier_id: data.supplier_id
            }
        });

        return supplier;
    }
};
