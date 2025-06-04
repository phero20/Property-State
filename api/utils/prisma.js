import { PrismaClient } from '@prisma/client';

// Create a global instance of PrismaClient to optimize connections
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Prevent multiple instances of Prisma Client in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;