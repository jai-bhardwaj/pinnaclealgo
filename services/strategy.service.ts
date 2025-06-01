import { prisma } from './prisma';
import { Strategy, StrategyStatus, Prisma } from '@prisma/client';
import {
    PaginationParams,
    FilterParams,
} from './types';

// Use Prisma generated types for consistency
type StrategyWithRelations = Strategy & {
    user?: any;
    orders?: any[];
    backtests?: any[];
    strategyLogs?: any[];
    _count?: any;
};

type CreateStrategyData = Prisma.StrategyCreateInput;
type UpdateStrategyData = Prisma.StrategyUpdateInput;

// Strategy CRUD operations
export const createStrategy = async (strategyData: CreateStrategyData): Promise<StrategyWithRelations> => {
    return prisma.strategy.create({
        data: {
            ...strategyData,
            margin: strategyData.margin || 5.0,
            marginType: strategyData.marginType || 'percentage',
            basePrice: strategyData.basePrice || 50000.0,
            totalPnl: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            winRate: 0,
            maxDrawdown: 0
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            _count: {
                select: {
                    orders: true,
                    backtests: true
                }
            }
        }
    });
};

export const getStrategyById = async (id: string): Promise<StrategyWithRelations | null> => {
    return prisma.strategy.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            orders: {
                take: 10,
                orderBy: { createdAt: 'desc' }
            },
            backtests: {
                take: 5,
                orderBy: { createdAt: 'desc' }
            },
            strategyLogs: {
                take: 20,
                orderBy: { timestamp: 'desc' }
            },
            _count: {
                select: {
                    orders: true,
                    backtests: true,
                    strategyLogs: true
                }
            }
        }
    });
};

export const getStrategiesByUserId = async (
    userId: string,
    pagination?: PaginationParams,
    filters?: FilterParams
) => {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.assetClass) where.assetClass = filters.assetClass;
    if (filters?.strategyType) where.strategyType = filters.strategyType;
    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } }
        ];
    }

    const [strategies, total] = await Promise.all([
        prisma.strategy.findMany({
            where,
            skip,
            take: limit,
            orderBy: pagination?.sortBy ? {
                [pagination.sortBy]: pagination.sortOrder || 'asc'
            } : { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        orders: true,
                        backtests: true
                    }
                }
            }
        }),
        prisma.strategy.count({ where })
    ]);

    return {
        data: strategies,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

export const updateStrategy = async (id: string, strategyData: UpdateStrategyData): Promise<StrategyWithRelations> => {
    return prisma.strategy.update({
        where: { id },
        data: strategyData,
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            _count: {
                select: {
                    orders: true,
                    backtests: true
                }
            }
        }
    });
};

export const deleteStrategy = async (id: string): Promise<void> => {
    await prisma.strategy.delete({
        where: { id }
    });
};

// Strategy status management
export const startStrategy = async (id: string): Promise<StrategyWithRelations> => {
    return prisma.strategy.update({
        where: { id },
        data: {
            status: StrategyStatus.ACTIVE,
            lastExecutedAt: new Date()
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            }
        }
    });
};

export const pauseStrategy = async (id: string): Promise<StrategyWithRelations> => {
    return prisma.strategy.update({
        where: { id },
        data: { status: StrategyStatus.PAUSED },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            }
        }
    });
};

export const stopStrategy = async (id: string): Promise<StrategyWithRelations> => {
    return prisma.strategy.update({
        where: { id },
        data: { status: StrategyStatus.STOPPED },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            }
        }
    });
};

// Strategy performance
export const updateStrategyPerformance = async (
    id: string,
    performance: {
        totalPnl?: number;
        totalTrades?: number;
        winningTrades?: number;
        losingTrades?: number;
        winRate?: number;
        sharpeRatio?: number;
        maxDrawdown?: number;
    }
) => {
    return prisma.strategy.update({
        where: { id },
        data: performance
    });
};

export const getStrategyPerformance = async (id: string) => {
    const strategy = await prisma.strategy.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            totalPnl: true,
            totalTrades: true,
            winningTrades: true,
            losingTrades: true,
            winRate: true,
            sharpeRatio: true,
            maxDrawdown: true,
            capitalAllocated: true,
            createdAt: true,
            lastExecutedAt: true
        }
    });

    if (!strategy) {
        throw new Error('Strategy not found');
    }

    // Get recent trades for this strategy
    const recentTrades = await prisma.trade.findMany({
        where: {
            order: {
                strategyId: id
            }
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
            order: {
                select: {
                    symbol: true,
                    side: true,
                    quantity: true
                }
            }
        }
    });

    return {
        ...strategy,
        recentTrades
    };
};

// Strategy logs
export const addStrategyLog = async (
    strategyId: string,
    level: 'INFO' | 'WARNING' | 'ERROR',
    message: string,
    data?: any
) => {
    return prisma.strategyLog.create({
        data: {
            strategyId,
            level,
            message,
            data
        }
    });
};

export const getStrategyLogs = async (
    strategyId: string,
    pagination?: PaginationParams,
    filters?: FilterParams
) => {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = { strategyId };

    if (filters?.level) where.level = filters.level;
    if (filters?.startDate && filters?.endDate) {
        where.timestamp = {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate)
        };
    }

    const [logs, total] = await Promise.all([
        prisma.strategyLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { timestamp: 'desc' }
        }),
        prisma.strategyLog.count({ where })
    ]);

    return {
        data: logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

// Strategy search and filtering
export const searchStrategies = async (
    query: string,
    filters?: FilterParams
): Promise<StrategyWithRelations[]> => {
    const where: any = {
        OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { strategyType: { contains: query, mode: 'insensitive' } }
        ]
    };

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;
    if (filters?.assetClass) where.assetClass = filters.assetClass;

    return prisma.strategy.findMany({
        where,
        take: 20,
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            _count: {
                select: {
                    orders: true,
                    backtests: true
                }
            }
        }
    });
};

// Strategy statistics
export const getStrategyStats = async (userId?: string) => {
    const where = userId ? { userId } : {};

    const [
        totalStrategies,
        activeStrategies,
        pausedStrategies,
        stoppedStrategies,
        totalPnl,
        totalTrades
    ] = await Promise.all([
        prisma.strategy.count({ where }),
        prisma.strategy.count({ where: { ...where, status: 'ACTIVE' } }),
        prisma.strategy.count({ where: { ...where, status: 'PAUSED' } }),
        prisma.strategy.count({ where: { ...where, status: 'STOPPED' } }),
        prisma.strategy.aggregate({
            where,
            _sum: { totalPnl: true }
        }),
        prisma.strategy.aggregate({
            where,
            _sum: { totalTrades: true }
        })
    ]);

    return {
        totalStrategies,
        activeStrategies,
        pausedStrategies,
        stoppedStrategies,
        totalPnl: totalPnl._sum.totalPnl || 0,
        totalTrades: totalTrades._sum.totalTrades || 0
    };
};

// Bulk operations
export const bulkUpdateStrategies = async (
    strategyIds: string[],
    updateData: Partial<UpdateStrategyData>
) => {
    return prisma.strategy.updateMany({
        where: {
            id: { in: strategyIds }
        },
        data: updateData
    });
};

export const bulkDeleteStrategies = async (strategyIds: string[]) => {
    return prisma.strategy.deleteMany({
        where: {
            id: { in: strategyIds }
        }
    });
};

// Strategy cloning
export const cloneStrategy = async (id: string, newName: string, userId: string) => {
    const originalStrategy = await prisma.strategy.findUnique({
        where: { id }
    });

    if (!originalStrategy) {
        throw new Error('Strategy not found');
    }

    const { id: _, createdAt, updatedAt, lastExecutedAt, nextExecutionAt, parameters, riskParameters, ...strategyData } = originalStrategy;

    return prisma.strategy.create({
        data: {
            ...strategyData,
            name: newName,
            userId,
            status: StrategyStatus.DRAFT,
            totalPnl: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            winRate: 0,
            maxDrawdown: 0,
            version: 1,
            parameters: parameters as Prisma.InputJsonValue,
            riskParameters: riskParameters as Prisma.InputJsonValue,
        }
    });
}; 