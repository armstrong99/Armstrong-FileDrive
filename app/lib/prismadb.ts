// lib/prismadb.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as typeof globalThis & {
  prisma?: PrismaClient;
};

export default globalForPrisma.prisma ??= new PrismaClient();
