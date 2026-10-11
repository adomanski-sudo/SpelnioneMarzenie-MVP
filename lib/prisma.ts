import { PrismaClient } from "@prisma/client";

// Inicjalizujemy globalną zmienną dla PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Tworzymy nową instancję tylko jeśli jeszcze nie istnieje w obiekcie globalnym
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// W trybie deweloperskim przypisujemy instancję do obiektu globalnego
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}