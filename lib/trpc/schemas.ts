import { z } from 'zod';

// Common schemas
export const paginationSchema = z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const filterSchema = z.record(z.any()).optional();

// User schemas
export const createUserSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(50),
    password: z.string().min(8),
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phone: z.string().optional(),
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).default('USER'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']).default('PENDING_VERIFICATION'),
    emailVerified: z.boolean().default(false),
    phoneVerified: z.boolean().default(false),
    twoFactorEnabled: z.boolean().default(false),
    loginAttempts: z.number().default(0),
});

export const updateUserSchema = z.object({
    email: z.string().email().optional(),
    username: z.string().min(3).max(50).optional(),
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phone: z.string().optional(),
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']).optional(),
    emailVerified: z.boolean().optional(),
    phoneVerified: z.boolean().optional(),
    twoFactorEnabled: z.boolean().optional(),
});

export const updateUserProfileSchema = z.object({
    avatar: z.string().optional(),
    bio: z.string().optional(),
    timezone: z.string().default('UTC'),
    language: z.string().default('en'),
    tradingExperience: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
    riskTolerance: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    investmentGoals: z.string().optional(),
    preferredAssets: z.array(z.string()).default([]),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
});

export const userFiltersSchema = z.object({
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION']).optional(),
    search: z.string().optional(),
});

// Strategy schemas
export const createStrategySchema = z.object({
    userId: z.string(),
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    strategyType: z.string(),
    assetClass: z.enum(['EQUITY', 'DERIVATIVES', 'CRYPTO', 'COMMODITIES', 'FOREX']),
    symbols: z.array(z.string()),
    timeframe: z.enum(['SECOND_1', 'SECOND_5', 'SECOND_15', 'SECOND_30', 'MINUTE_1', 'MINUTE_3', 'MINUTE_5', 'MINUTE_15', 'MINUTE_30', 'HOUR_1', 'HOUR_4', 'DAY_1', 'WEEK_1', 'MONTH_1']),
    status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'STOPPED', 'ERROR', 'BACKTESTING']).default('DRAFT'),
    parameters: z.any(),
    riskParameters: z.any(),
    isLive: z.boolean().default(false),
    isPaperTrading: z.boolean().default(true),
    maxPositions: z.number().min(1).default(5),
    capitalAllocated: z.number().min(0).default(100000),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    activeDays: z.array(z.string()).default([]),
    version: z.number().default(1),
});

export const updateStrategySchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    strategyType: z.string().optional(),
    assetClass: z.enum(['EQUITY', 'DERIVATIVES', 'CRYPTO', 'COMMODITIES', 'FOREX']).optional(),
    symbols: z.array(z.string()).optional(),
    timeframe: z.enum(['SECOND_1', 'SECOND_5', 'SECOND_15', 'SECOND_30', 'MINUTE_1', 'MINUTE_3', 'MINUTE_5', 'MINUTE_15', 'MINUTE_30', 'HOUR_1', 'HOUR_4', 'DAY_1', 'WEEK_1', 'MONTH_1']).optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'STOPPED', 'ERROR', 'BACKTESTING']).optional(),
    parameters: z.any().optional(),
    riskParameters: z.any().optional(),
    isLive: z.boolean().optional(),
    isPaperTrading: z.boolean().optional(),
    maxPositions: z.number().min(1).optional(),
    capitalAllocated: z.number().min(0).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    activeDays: z.array(z.string()).optional(),
});

export const strategyFiltersSchema = z.object({
    status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'STOPPED', 'ERROR', 'BACKTESTING']).optional(),
    assetClass: z.enum(['EQUITY', 'DERIVATIVES', 'CRYPTO', 'COMMODITIES', 'FOREX']).optional(),
    strategyType: z.string().optional(),
    search: z.string().optional(),
});

export const updateStrategyPerformanceSchema = z.object({
    totalPnl: z.number().optional(),
    totalTrades: z.number().optional(),
    winningTrades: z.number().optional(),
    losingTrades: z.number().optional(),
    winRate: z.number().optional(),
    sharpeRatio: z.number().optional(),
    maxDrawdown: z.number().optional(),
});

export const addStrategyLogSchema = z.object({
    strategyId: z.string(),
    level: z.enum(['INFO', 'WARNING', 'ERROR']),
    message: z.string(),
    data: z.any().optional(),
});

export const cloneStrategySchema = z.object({
    id: z.string(),
    newName: z.string().min(1).max(100),
    userId: z.string(),
});

// Order schemas
export const createOrderSchema = z.object({
    userId: z.string(),
    strategyId: z.string().optional(),
    symbol: z.string(),
    exchange: z.string(),
    side: z.enum(['BUY', 'SELL']),
    orderType: z.enum(['MARKET', 'LIMIT', 'SL', 'SL_M']),
    productType: z.enum(['DELIVERY', 'INTRADAY', 'MARGIN', 'NORMAL', 'CARRYFORWARD', 'BO', 'CO']),
    quantity: z.number().min(1),
    price: z.number().optional(),
    triggerPrice: z.number().optional(),
    variety: z.string().default('NORMAL'),
    isPaperTrade: z.boolean().default(false),
    parentOrderId: z.string().optional(),
    tags: z.array(z.string()).default([]),
    notes: z.string().optional(),
});

export const updateOrderSchema = z.object({
    status: z.enum(['PENDING', 'PLACED', 'OPEN', 'COMPLETE', 'CANCELLED', 'REJECTED', 'ERROR', 'UNKNOWN']).optional(),
    statusMessage: z.string().optional(),
    filledQuantity: z.number().optional(),
    averagePrice: z.number().optional(),
    brokerOrderId: z.string().optional(),
    executedAt: z.date().optional(),
    cancelledAt: z.date().optional(),
});

export const orderFiltersSchema = z.object({
    status: z.enum(['PENDING', 'PLACED', 'OPEN', 'COMPLETE', 'CANCELLED', 'REJECTED', 'ERROR', 'UNKNOWN']).optional(),
    side: z.enum(['BUY', 'SELL']).optional(),
    orderType: z.enum(['MARKET', 'LIMIT', 'SL', 'SL_M']).optional(),
    productType: z.enum(['DELIVERY', 'INTRADAY', 'MARGIN', 'NORMAL', 'CARRYFORWARD', 'BO', 'CO']).optional(),
    symbol: z.string().optional(),
    strategyId: z.string().optional(),
    isPaperTrade: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const executeOrderSchema = z.object({
    filledQuantity: z.number().min(0),
    averagePrice: z.number().min(0),
    brokerOrderId: z.string().optional(),
});

export const cancelOrderSchema = z.object({
    reason: z.string().optional(),
});

export const rejectOrderSchema = z.object({
    reason: z.string(),
});

// Portfolio schemas
export const createPositionSchema = z.object({
    userId: z.string(),
    symbol: z.string(),
    exchange: z.string(),
    productType: z.enum(['DELIVERY', 'INTRADAY', 'MARGIN', 'NORMAL', 'CARRYFORWARD', 'BO', 'CO']),
    quantity: z.number(),
    averagePrice: z.number().min(0),
    lastTradedPrice: z.number().min(0),
    pnl: z.number(),
    realizedPnl: z.number().default(0),
    marketValue: z.number(),
    dayChange: z.number().default(0),
    dayChangePct: z.number().default(0),
    firstBuyDate: z.date().optional(),
    lastTradeDate: z.date().optional(),
});

export const updatePositionSchema = z.object({
    quantity: z.number().optional(),
    averagePrice: z.number().min(0).optional(),
    lastTradedPrice: z.number().min(0).optional(),
    pnl: z.number().optional(),
    realizedPnl: z.number().optional(),
    marketValue: z.number().optional(),
    dayChange: z.number().optional(),
    dayChangePct: z.number().optional(),
    lastTradeDate: z.date().optional(),
});

export const positionFiltersSchema = z.object({
    symbol: z.string().optional(),
    exchange: z.string().optional(),
    productType: z.enum(['DELIVERY', 'INTRADAY', 'MARGIN', 'NORMAL', 'CARRYFORWARD', 'BO', 'CO']).optional(),
    minQuantity: z.number().optional(),
    maxQuantity: z.number().optional(),
});

export const updatePositionPnLSchema = z.object({
    lastTradedPrice: z.number().min(0),
    dayChange: z.number(),
    dayChangePct: z.number(),
});

export const updateBalanceSchema = z.object({
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

export const portfolioPerformanceSchema = z.object({
    startDate: z.date(),
    endDate: z.date(),
});

// Bulk operation schemas
export const bulkUpdateUsersSchema = z.object({
    userIds: z.array(z.string()),
    updateData: updateUserSchema,
});

export const bulkDeleteUsersSchema = z.object({
    userIds: z.array(z.string()),
});

export const bulkUpdateStrategiesSchema = z.object({
    strategyIds: z.array(z.string()),
    updateData: updateStrategySchema,
});

export const bulkDeleteStrategiesSchema = z.object({
    strategyIds: z.array(z.string()),
});

export const bulkUpdateOrdersSchema = z.object({
    orderIds: z.array(z.string()),
    updateData: updateOrderSchema,
});

export const bulkCancelOrdersSchema = z.object({
    orderIds: z.array(z.string()),
    reason: z.string().optional(),
});

export const bulkUpdatePositionsSchema = z.object({
    positionIds: z.array(z.string()),
    updateData: updatePositionSchema,
});

// Search schemas
export const searchSchema = z.object({
    query: z.string().min(1),
    filters: z.record(z.any()).optional(),
});

// Date range schema
export const dateRangeSchema = z.object({
    startDate: z.date(),
    endDate: z.date(),
});

// ID schema
export const idSchema = z.string().min(1); 