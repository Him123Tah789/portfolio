import { PrismaClient } from "@prisma/client";

declare const globalThis: {
    prismaGlobal?: PrismaClient;
} & typeof global;

function createPrismaClient() {
    try {
        return new PrismaClient();
    } catch (error) {
        console.error("Failed to initialize Prisma Client:", error);
        return null;
    }
}

const prismaInstance = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prismaInstance) {
    globalThis.prismaGlobal = prismaInstance;
}

const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop) {
        if (!prismaInstance) {
            throw new Error("Prisma Client is unavailable. Check DATABASE_URL and database connectivity.");
        }

        const value = (prismaInstance as unknown as Record<string, unknown>)[String(prop)];
        return typeof value === "function" ? (value as Function).bind(prismaInstance) : value;
    },
});

export default prisma;
