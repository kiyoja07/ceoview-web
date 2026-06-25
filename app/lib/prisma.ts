import { PrismaClient } from "@prisma/client";

export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$use" | "$extends"
>;

// Alias for the interactive transaction client type provided by Prisma
export type PrismaTx = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ errorFormat: "minimal" });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
