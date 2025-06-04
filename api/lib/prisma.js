import { PrismaClient } from '@prisma/client';

let prisma;

// Check if we're in production to avoid multiple instances in development
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to avoid multiple instances
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'] // Enable logging in development
    });
  }
  prisma = global.prisma;
}

export default prisma;
