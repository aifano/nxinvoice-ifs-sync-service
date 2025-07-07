export const createMockPrismaClient = () => ({
  supplier: {
    create: jest.fn(),
    createMany: jest.fn().mockResolvedValue({ count: 1 }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
  },
  supplierBankAddresse: {
    create: jest.fn(),
    createMany: jest.fn().mockResolvedValue({ count: 1 }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
  },
});

export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;