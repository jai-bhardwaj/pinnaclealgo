import { initTRPC } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { prisma } from '@/services/prisma';
import superjson from 'superjson';
import { ZodError } from 'zod';

/**
 * 1. CONTEXT
 *
 * This is the context for your tRPC API.
 * It's used to provide ingredients to your tRPC procedures.
 */
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
    const { req } = opts;

    // For now, we'll handle auth in middleware
    // You can add session logic here later
    return {
        prisma,
        req,
        // session: null, // Add session logic here when NextAuth is properly configured
    };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and router.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError:
                    error.cause instanceof ZodError
                        ? error.cause.flatten()
                        : null,
            },
        };
    },
});

/**
 * 3. ROUTER & PROCEDURE HEADERS
 *
 * Once a tRPC instance has been established, you can acquire the headers,
 * which allow you to create routers and procedures.
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API.
 * It does not guarantee that a user querying is authorized, but you can still access
 * user session data if they are logged in.
 */
export const publicProcedure = t.procedure;

// For now, we'll create simple procedures without authentication
// You can add authentication middleware later when NextAuth is properly configured

// Protected procedure (placeholder - add auth later)
export const protectedProcedure = t.procedure;

// Admin procedure (placeholder - add auth later)  
export const adminProcedure = t.procedure;

// Helper to get current user ID (placeholder)
export const getCurrentUserId = (ctx: Context): string => {
    // For now, return a mock user ID
    // Replace this with actual session logic when auth is implemented
    return 'mock-user-id';
}; 