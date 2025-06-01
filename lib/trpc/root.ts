import { createTRPCRouter } from './trpc';
import { userRouter } from './routers/user';
import { strategyRouter } from './routers/strategy';
import { orderRouter } from './routers/order';
import { portfolioRouter } from './routers/portfolio';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    user: userRouter,
    strategy: strategyRouter,
    order: orderRouter,
    portfolio: portfolioRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter; 