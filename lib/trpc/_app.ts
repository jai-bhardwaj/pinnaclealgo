import { createTRPCRouter } from './trpc';
import { strategyRouter } from './routers/strategy';
import { portfolioRouter } from './routers/portfolio';
import { userRouter } from './routers/user';
import { orderRouter } from './routers/order';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  strategy: strategyRouter,
  portfolio: portfolioRouter,
  user: userRouter,
  order: orderRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter; 