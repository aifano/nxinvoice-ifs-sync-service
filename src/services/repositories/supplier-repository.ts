import { PrismaClient, Prisma } from '@prisma/client';
import { IFS_SupplierInfoTab } from '../../types/ifs-supplier-info-tab';

const prisma = new PrismaClient();

export const supplierOps = {
    insert: (data: IFS_SupplierInfoTab, organization_id: string) => prisma.supplier.create({
        data: {
            supplier_id: data.supplier_id || '',
            name: data.name || '',
            organization_group_id: organization_id,
            external_id: data.rowkey,
        }
    }),

    update: async (data: IFS_SupplierInfoTab, organizationId: string) => {
        const supplier = await supplierOps.__get_supplier(data, organizationId);

        if (!supplier) {
            throw new Error('Supplier not found');
        }

        return prisma.supplier.update({
            where: {
                id: supplier.id
            },
            data: {
                name: data.name || ''
            }
        });
    },

    upsert: async (data: IFS_SupplierInfoTab, organizationId: string) => {
        const supplier = await supplierOps.__get_supplier(data, organizationId);

        if (!supplier) {
            return await prisma.supplier.create({
                data: {
                    supplier_id: data.supplier_id || '',
                    name: data.name || '',
                    organization_group_id: organizationId,
                    external_id: data.rowkey
                }
            });
        }
        return await prisma.supplier.update({
            where: {
                id: supplier.id
            },
            data: {
                name: data.name || ''
            }
        });
    },

    delete: async (data: IFS_SupplierInfoTab, organizationId: string) => {
        const supplier = await supplierOps.__get_supplier(data, organizationId);

        if (!supplier) {
            throw new Error('Supplier not found');
        }

        return prisma.supplier.delete({
            where: {
                id: supplier.id
            }
        });
    },

    __get_supplier: async (data: IFS_SupplierInfoTab, organizationId: string) => {
        if (!data.rowkey && !data.supplier_id) {
            throw new Error('Missing rowkey or supplier_id');
        }

        let supplier;
        if (data.rowkey) {
            supplier = await prisma.supplier.findFirst({
                where: {
                    organization_group_id: organizationId,
                    external_id: data.rowkey
                }
            });
        } else if (data.supplier_id) {
            supplier = await prisma.supplier.findFirst({
                where: {
                    organization_group_id: organizationId,
                    supplier_id: data.supplier_id
                }
            });
        }

        return supplier;
    }
};
