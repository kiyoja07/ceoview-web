import { PrismaClient } from "@/app/generated/prisma-client/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$use" | "$extends"
>;

// Alias for the interactive transaction client type provided by Prisma
export type PrismaTx = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

const adapter = new PrismaMariaDb({
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "admin-system-saas",
});

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
