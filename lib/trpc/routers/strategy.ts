import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import * as strategyService from '@/services/strategy.service';
import { StrategyStatus, AssetClass, TimeFrame } from '@prisma/client';

// Mock user ID for development - replace with actual session logic later
const MOCK_USER_ID = 'mock-user-id';

// Input validation schemas
const createStrategySchema = z.object({
    user: z.object({
        connect: z.object({
            id: z.string(),
        }),
    }),
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    strategyType: z.string().min(1),
    assetClass: z.nativeEnum(AssetClass),
    timeframe: z.nativeEnum(TimeFrame),
    capitalAllocated: z.number().positive(),
    maxPositions: z.number().int().positive().optional(),
    riskPerTrade: z.number().min(0).max(1).optional(),
    isActive: z.boolean().optional().default(true),
    version: z.number().int().positive().optional().default(1),
    margin: z.number().positive().optional().default(5),
    marginType: z.enum(['percentage', 'rupees']).optional().default('percentage'),
    basePrice: z.number().positive().optional().default(50000),
});

const updateStrategySchema = z.object({
    id: z.string(),
    name: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    strategyType: z.string().optional(),
    assetClass: z.nativeEnum(AssetClass).optional(),
    timeframe: z.nativeEnum(TimeFrame).optional(),
    capitalAllocated: z.number().positive().optional(),
    maxPositions: z.number().int().positive().optional(),
    riskPerTrade: z.number().min(0).max(1).optional(),
    isActive: z.boolean().optional(),
    margin: z.number().positive().optional(),
    marginType: z.enum(['percentage', 'rupees']).optional(),
    basePrice: z.number().positive().optional(),
    status: z.nativeEnum(StrategyStatus).optional(),
});

const paginationSchema = z.object({
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

const strategyFiltersSchema = z.object({
    status: z.nativeEnum(StrategyStatus).optional(),
    assetClass: z.nativeEnum(AssetClass).optional(),
    strategyType: z.string().optional(),
    search: z.string().optional(),
    userId: z.string().optional(),
});

const performanceUpdateSchema = z.object({
    id: z.string(),
    totalPnl: z.number().optional(),
    totalTrades: z.number().int().optional(),
    winningTrades: z.number().int().optional(),
    losingTrades: z.number().int().optional(),
    winRate: z.number().min(0).max(100).optional(),
    sharpeRatio: z.number().optional(),
    maxDrawdown: z.number().optional(),
});

const strategyLogSchema = z.object({
    strategyId: z.string(),
    level: z.enum(['INFO', 'WARNING', 'ERROR']),
    message: z.string().min(1),
    data: z.record(z.any()).optional(),
});

export const strategyRouter = createTRPCRouter({
    // Get all strategies for the current user
    getAll: protectedProcedure
        .query(async ({ ctx }) => {
            try {
                // Use mock user ID for now - replace with actual session logic later
                const userId = MOCK_USER_ID;
                
                const result = await strategyService.getStrategiesByUserId(userId);
                
                // Transform data to match frontend expectations
                const strategies = result.data.map(strategy => ({
                    id: strategy.id,
                    name: strategy.name,
                    margin: strategy.margin || 5,
                    marginType: strategy.marginType || 'percentage',
                    basePrice: strategy.basePrice || 50000,
                    status: strategy.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
                    lastUpdated: strategy.updatedAt.toLocaleDateString(),
                    user_id: strategy.userId,
                    description: strategy.description,
                    strategyType: strategy.strategyType,
                    assetClass: strategy.assetClass,
                    symbols: strategy.symbols,
                    timeframe: strategy.timeframe,
                    parameters: strategy.parameters,
                    riskParameters: strategy.riskParameters,
                    isLive: strategy.isLive,
                    isPaperTrading: strategy.isPaperTrading,
                    maxPositions: strategy.maxPositions,
                    capitalAllocated: strategy.capitalAllocated,
                    totalPnl: strategy.totalPnl,
                    totalTrades: strategy.totalTrades,
                    winRate: strategy.winRate,
                }));
                
                return strategies;
            } catch (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to fetch strategies',
                });
            }
        }),

    // Initialize default strategies
    initialize: protectedProcedure
        .mutation(async ({ ctx }) => {
            try {
                // Use mock user ID for now - replace with actual session logic later
                const userId = MOCK_USER_ID;
                
                // Create some default strategies for demo
                const defaultStrategies = [
                    {
                        name: 'NIFTY Swing Strategy',
                        description: 'Default swing trading strategy for NIFTY',
                        strategyType: 'swing_trading',
                        assetClass: AssetClass.EQUITY,
                        timeframe: TimeFrame.MINUTE_5,
                        symbols: ['NIFTY'],
                        capitalAllocated: 100000,
                        margin: 5,
                        marginType: 'percentage' as const,
                        basePrice: 24000,
                        status: StrategyStatus.DRAFT,
                        parameters: {},
                        riskParameters: {},
                    },
                    {
                        name: 'Option Scalping Strategy',
                        description: 'Default scalping strategy for options',
                        strategyType: 'scalping',
                        assetClass: AssetClass.DERIVATIVES,
                        timeframe: TimeFrame.MINUTE_1,
                        symbols: ['BANKNIFTY'],
                        capitalAllocated: 50000,
                        margin: 2500,
                        marginType: 'rupees' as const,
                        basePrice: 50000,
                        status: StrategyStatus.DRAFT,
                        parameters: {},
                        riskParameters: {},
                    },
                ];
                
                const createdStrategies = [];
                for (const strategyData of defaultStrategies) {
                    const strategy = await strategyService.createStrategy({
                        user: { connect: { id: userId } },
                        ...strategyData,
                    });
                    createdStrategies.push(strategy);
                }
                
                return createdStrategies.map(strategy => ({
                    id: strategy.id,
                    name: strategy.name,
                    margin: strategy.margin || 5,
                    marginType: strategy.marginType || 'percentage',
                    basePrice: strategy.basePrice || 50000,
                    status: 'inactive',
                    lastUpdated: strategy.updatedAt.toLocaleDateString(),
                    user_id: strategy.userId,
                }));
            } catch (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to initialize strategies',
                });
            }
        }),

    // Square off a specific strategy
    squareOff: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            try {
                // In a real implementation, this would close all positions for the strategy
                // For now, we'll just update the strategy status to stopped
                await strategyService.updateStrategy(input.id, {
                    status: StrategyStatus.STOPPED,
                    lastExecutedAt: new Date(),
                });
                
                return {
                    message: `Strategy ${input.id} squared off successfully`,
                    success: true,
                };
            } catch (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to square off strategy',
                });
            }
        }),

    // Square off all strategies
    squareOffAll: protectedProcedure
        .mutation(async ({ ctx }) => {
            try {
                // Use mock user ID for now - replace with actual session logic later
                const userId = MOCK_USER_ID;
                
                // Get all active strategies for the user
                const result = await strategyService.getStrategiesByUserId(userId, undefined, {
                    status: StrategyStatus.ACTIVE,
                });
                
                // Update all active strategies to stopped
                const updatePromises = result.data.map(strategy => 
                    strategyService.updateStrategy(strategy.id, {
                        status: StrategyStatus.STOPPED,
                        lastExecutedAt: new Date(),
                    })
                );
                
                await Promise.all(updatePromises);
                
                return {
                    message: `${result.data.length} strategies squared off successfully`,
                    success: true,
                };
            } catch (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to square off all strategies',
                });
            }
        }),

    // Create strategy
    create: protectedProcedure
        .input(createStrategySchema)
        .mutation(async ({ input }) => {
            try {
                // Add default parameters
                const strategyData = {
                    ...input,
                    parameters: {},
                    riskParameters: {},
                };
                return await strategyService.createStrategy(strategyData);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to create strategy',
                });
            }
        }),

    // Get strategy by ID
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const strategy = await strategyService.getStrategyById(input.id);
            if (!strategy) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Strategy not found',
                });
            }
            return strategy;
        }),

    // Get strategies by user ID
    getByUserId: protectedProcedure
        .input(z.object({
            userId: z.string(),
            pagination: paginationSchema.optional(),
            filters: strategyFiltersSchema.optional(),
        }))
        .query(async ({ input }) => {
            return await strategyService.getStrategiesByUserId(
                input.userId,
                input.pagination,
                input.filters
            );
        }),

    // Update strategy (including margin fields)
    update: protectedProcedure
        .input(updateStrategySchema)
        .mutation(async ({ input }) => {
            const { id, ...updateData } = input;
            try {
                const updatedStrategy = await strategyService.updateStrategy(id, updateData);
                
                // Return in the format expected by frontend
                return {
                    id: updatedStrategy.id,
                    name: updatedStrategy.name,
                    margin: updatedStrategy.margin || 5,
                    marginType: updatedStrategy.marginType || 'percentage',
                    basePrice: updatedStrategy.basePrice || 50000,
                    status: updatedStrategy.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
                    lastUpdated: updatedStrategy.updatedAt.toLocaleDateString(),
                    user_id: updatedStrategy.userId,
                    description: updatedStrategy.description,
                    strategyType: updatedStrategy.strategyType,
                    assetClass: updatedStrategy.assetClass,
                    symbols: updatedStrategy.symbols,
                    timeframe: updatedStrategy.timeframe,
                    parameters: updatedStrategy.parameters,
                    riskParameters: updatedStrategy.riskParameters,
                    isLive: updatedStrategy.isLive,
                    isPaperTrading: updatedStrategy.isPaperTrading,
                    maxPositions: updatedStrategy.maxPositions,
                    capitalAllocated: updatedStrategy.capitalAllocated,
                    totalPnl: updatedStrategy.totalPnl,
                    totalTrades: updatedStrategy.totalTrades,
                    winRate: updatedStrategy.winRate,
                };
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to update strategy',
                });
            }
        }),

    // Delete strategy
    remove: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            try {
                await strategyService.deleteStrategy(input.id);
                return { success: true };
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to delete strategy',
                });
            }
        }),

    // Strategy status management
    start: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            try {
                return await strategyService.startStrategy(input.id);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to start strategy',
                });
            }
        }),

    pause: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            try {
                return await strategyService.pauseStrategy(input.id);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to pause strategy',
                });
            }
        }),

    stop: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            try {
                return await strategyService.stopStrategy(input.id);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to stop strategy',
                });
            }
        }),

    // Strategy performance
    updatePerformance: protectedProcedure
        .input(performanceUpdateSchema)
        .mutation(async ({ input }) => {
            const { id, ...performance } = input;
            try {
                return await strategyService.updateStrategyPerformance(id, performance);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to update performance',
                });
            }
        }),

    getPerformance: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            try {
                return await strategyService.getStrategyPerformance(input.id);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to get performance',
                });
            }
        }),

    // Strategy logs
    addLog: protectedProcedure
        .input(strategyLogSchema)
        .mutation(async ({ input }) => {
            try {
                return await strategyService.addStrategyLog(
                    input.strategyId,
                    input.level,
                    input.message,
                    input.data
                );
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to add log',
                });
            }
        }),

    getLogs: protectedProcedure
        .input(z.object({
            strategyId: z.string(),
            pagination: paginationSchema.optional(),
            filters: z.object({
                level: z.enum(['INFO', 'WARNING', 'ERROR']).optional(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
            }).optional(),
        }))
        .query(async ({ input }) => {
            return await strategyService.getStrategyLogs(
                input.strategyId,
                input.pagination,
                input.filters
            );
        }),

    // Search strategies
    search: protectedProcedure
        .input(z.object({
            query: z.string().min(1),
            filters: strategyFiltersSchema.optional(),
        }))
        .query(async ({ input }) => {
            return await strategyService.searchStrategies(input.query, input.filters);
        }),

    // Strategy statistics
    getStats: protectedProcedure
        .input(z.object({
            userId: z.string().optional(),
        }))
        .query(async ({ input }) => {
            return await strategyService.getStrategyStats(input.userId);
        }),

    // Bulk operations
    bulkUpdate: protectedProcedure
        .input(z.object({
            strategyIds: z.array(z.string()),
            updateData: z.object({
                status: z.nativeEnum(StrategyStatus).optional(),
                isActive: z.boolean().optional(),
                capitalAllocated: z.number().positive().optional(),
            }),
        }))
        .mutation(async ({ input }) => {
            try {
                return await strategyService.bulkUpdateStrategies(input.strategyIds, input.updateData);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to bulk update strategies',
                });
            }
        }),

    bulkDelete: protectedProcedure
        .input(z.object({
            strategyIds: z.array(z.string()),
        }))
        .mutation(async ({ input }) => {
            try {
                return await strategyService.bulkDeleteStrategies(input.strategyIds);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to bulk delete strategies',
                });
            }
        }),

    // Strategy cloning
    clone: protectedProcedure
        .input(z.object({
            id: z.string(),
            newName: z.string().min(1).max(200),
            userId: z.string(),
        }))
        .mutation(async ({ input }) => {
            try {
                return await strategyService.cloneStrategy(input.id, input.newName, input.userId);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to clone strategy',
                });
            }
        }),
}); 