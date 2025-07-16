import { PrismaClient, Prisma } from '@prisma/client';
import { IFS_PaymentAddressTab } from '../../types/ifs-payment-address-tab';

const prisma = new PrismaClient();

export const supplierBankAddressOps = {
    insert: (data: IFS_PaymentAddressTab, organization_id: string) => prisma.supplierBankAddresse.create({
        data: {
            tenant_id: data.company || '',
            supplier_id: data.identity || '',
            supplier_name: data.supplier_name || null,
            bank_name: data.bank_name || null,
            iban: data.account || null,
            bic: data.bic_code || null,
            is_default: data.default_address === 'TRUE',
            blocked_for_use: data.blocked_for_use === 'TRUE',
            way_id: data.way_id || null,
            organization_id: organization_id
        }
    }),

    update: async (data: IFS_PaymentAddressTab, organizationId: string) => {
        const payment_address = await supplierBankAddressOps.__get_payment_address(data, organizationId);

        if (!payment_address) {
            throw new Error('Payment address not found');
        }

        return prisma.supplierBankAddresse.update({
            where: {
                id: payment_address.id
            },
            data: {
                tenant_id: data.company || '',
                supplier_id: data.identity || '',
                supplier_name: data.supplier_name || null,
                bank_name: data.bank_name || null,
                iban: data.account || null,
                bic: data.bic_code || null,
                is_default: data.default_address === 'TRUE',
                blocked_for_use: data.blocked_for_use === 'TRUE',
                way_id: data.way_id || null,
                address_id: data.address_id || null
            }
        });
    },

    upsert: async (data: IFS_PaymentAddressTab, organizationId: string) => {
        const payment_address = await supplierBankAddressOps.__get_payment_address(data, organizationId);

        if (!payment_address) {
            return await prisma.supplierBankAddresse.create({
                data: {
                    tenant_id: data.company || '',
                    supplier_id: data.identity || '',
                    supplier_name: data.supplier_name || null,
                    bank_name: data.bank_name || null,
                    iban: data.account || null,
                    bic: data.bic_code || null,
                    is_default: data.default_address === 'TRUE',
                    blocked_for_use: data.blocked_for_use === 'TRUE',
                    way_id: data.way_id || null,
                    address_id: data.address_id || null,
                    external_id: data.rowkey || null,
                    organization_id: organizationId
                }
            });
        }
        return await prisma.supplierBankAddresse.update({
            where: {
                id: payment_address.id
            },
            data: {
                tenant_id: data.company || '',
                supplier_id: data.identity || '',
                supplier_name: data.supplier_name || null,
                bank_name: data.bank_name || null,
                iban: data.account || null,
                bic: data.bic_code || null,
                is_default: data.default_address === 'TRUE',
                blocked_for_use: data.blocked_for_use === 'TRUE',
                way_id: data.way_id || null,
                address_id: data.address_id || null,
            }
        });
    },

    delete: async (data: IFS_PaymentAddressTab, organizationId: string) => {
        const payment_address = await supplierBankAddressOps.__get_payment_address(data, organizationId);

        if (!payment_address) {
            throw new Error('Payment address not found');
        }
        return prisma.supplierBankAddresse.delete({
            where: {
                id: payment_address.id
            }
        });
    },

    __get_payment_address: async (data: IFS_PaymentAddressTab, organizationId: string) => {
        if (!data.rowkey) {
            throw new Error('Missing rowkey');
        }

        let payment_address = await prisma.supplierBankAddresse.findFirst({
            where: {
                organization_id: organizationId,
                external_id: data.rowkey
            }
        });

        return payment_address;
    }
};
