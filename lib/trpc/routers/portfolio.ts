import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import * as portfolioService from '@/services/portfolio.service';
import { ProductType } from '@prisma/client';

// Input validation schemas
const createPositionSchema = z.object({
    user: z.object({
        connect: z.object({
            id: z.string(),
        }),
    }),
    symbol: z.string().min(1),
    exchange: z.string().min(1),
    productType: z.nativeEnum(ProductType),
    quantity: z.number(),
    averagePrice: z.number().positive(),
    lastTradedPrice: z.number().positive(),
    marketValue: z.number(),
    pnl: z.number(),
    dayChange: z.number().optional().default(0),
    dayChangePct: z.number().optional().default(0),
    realizedPnl: z.number().optional().default(0),
    lastTradeDate: z.date().optional(),
});

const updatePositionSchema = z.object({
    id: z.string(),
    quantity: z.number().optional(),
    averagePrice: z.number().positive().optional(),
    lastTradedPrice: z.number().positive().optional(),
    marketValue: z.number().optional(),
    pnl: z.number().optional(),
    dayChange: z.number().optional(),
    dayChangePct: z.number().optional(),
    realizedPnl: z.number().optional(),
    lastTradeDate: z.date().optional(),
});

const updateBalanceSchema = z.object({
    userId: z.string(),
    availableCash: z.number().optional(),
    usedMargin: z.number().optional(),
    totalBalance: z.number().optional(),
    portfolioValue: z.number().optional(),
    totalPnl: z.number().optional(),
    dayPnl: z.number().optional(),
    buyingPower: z.number().optional(),
    marginUsed: z.number().optional(),
    marginAvailable: z.number().optional(),
});

const paginationSchema = z.object({
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

const portfolioFiltersSchema = z.object({
    symbol: z.string().optional(),
    exchange: z.string().optional(),
    productType: z.nativeEnum(ProductType).optional(),
    minQuantity: z.number().optional(),
    maxQuantity: z.number().optional(),
});

export const portfolioRouter = createTRPCRouter({
    // Position management
    createPosition: protectedProcedure
        .input(createPositionSchema)
        .mutation(async ({ input }) => {
            try {
                return await portfolioService.createPosition(input);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to create position',
                });
            }
        }),

    getPositionById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const position = await portfolioService.getPositionById(input.id);
            if (!position) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Position not found',
                });
            }
            return position;
        }),

    getPositionsByUserId: protectedProcedure
        .input(z.object({
            userId: z.string(),
            pagination: paginationSchema.optional(),
            filters: portfolioFiltersSchema.optional(),
        }))
        .query(async ({ input }) => {
            return await portfolioService.getPositionsByUserId(
                input.userId,
                input.pagination,
                input.filters
            );
        }),

    updatePosition: protectedProcedure
        .input(updatePositionSchema)
        .mutation(async ({ input }) => {
            const { id, ...updateData } = input;
            try {
                return await portfolioService.updatePosition(id, updateData);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to update position',
                });
            }
        }),

    deletePosition: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            try {
                await portfolioService.deletePosition(input.id);
                return { success: true };
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to delete position',
                });
            }
        }),

    // Position P&L calculations
    updatePositionPnL: protectedProcedure
        .input(z.object({
            id: z.string(),
            lastTradedPrice: z.number().positive(),
            dayChange: z.number(),
            dayChangePct: z.number(),
        }))
        .mutation(async ({ input }) => {
            try {
                return await portfolioService.updatePositionPnL(
                    input.id,
                    input.lastTradedPrice,
                    input.dayChange,
                    input.dayChangePct
                );
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to update position P&L',
                });
            }
        }),

    // Balance management
    getUserBalance: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
            return await portfolioService.getUserBalance(input.userId);
        }),

    updateUserBalance: protectedProcedure
        .input(updateBalanceSchema)
        .mutation(async ({ input }) => {
            const { userId, ...balanceData } = input;
            try {
                return await portfolioService.updateUserBalance(userId, balanceData);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to update balance',
                });
            }
        }),

    // Portfolio analytics
    getPortfolioSummary: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
            try {
                return await portfolioService.getPortfolioSummary(input.userId);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to get portfolio summary',
                });
            }
        }),

    getPortfolioPerformance: protectedProcedure
        .input(z.object({
            userId: z.string(),
            startDate: z.string(),
            endDate: z.string(),
        }))
        .query(async ({ input }) => {
            try {
                return await portfolioService.getPortfolioPerformance(
                    input.userId,
                    new Date(input.startDate),
                    new Date(input.endDate)
                );
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to get portfolio performance',
                });
            }
        }),

    // Position aggregation
    getPositionsBySymbol: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
            return await portfolioService.getPositionsBySymbol(input.userId);
        }),

    getPositionsByExchange: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
            return await portfolioService.getPositionsByExchange(input.userId);
        }),

    // Risk metrics
    getPortfolioRisk: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
            try {
                return await portfolioService.getPortfolioRisk(input.userId);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to get portfolio risk',
                });
            }
        }),

    // Bulk operations
    bulkUpdatePositions: protectedProcedure
        .input(z.object({
            positionIds: z.array(z.string()),
            updateData: z.object({
                lastTradedPrice: z.number().positive().optional(),
                dayChange: z.number().optional(),
                dayChangePct: z.number().optional(),
            }),
        }))
        .mutation(async ({ input }) => {
            try {
                return await portfolioService.bulkUpdatePositions(input.positionIds, input.updateData);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to bulk update positions',
                });
            }
        }),

    closeAllPositions: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(async ({ input }) => {
            try {
                return await portfolioService.closeAllPositions(input.userId);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to close all positions',
                });
            }
        }),
}); 