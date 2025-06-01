import { prisma } from './prisma';
import { Position, Balance, ProductType, Prisma } from '@prisma/client';
import {
    PaginationParams,
    FilterParams,
} from './types';

// Use Prisma generated types for consistency
type PositionWithRelations = Position & {
    user?: any;
};

type BalanceWithRelations = Balance & {
    user?: any;
};

type CreatePositionData = Prisma.PositionCreateInput;
type UpdatePositionData = Prisma.PositionUpdateInput;

// Position management
export const createPosition = async (positionData: CreatePositionData): Promise<PositionWithRelations> => {
    return prisma.position.create({
        data: positionData,
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

export const getPositionById = async (id: string): Promise<PositionWithRelations | null> => {
    return prisma.position.findUnique({
        where: { id },
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

export const getPositionsByUserId = async (
    userId: string,
    pagination?: PaginationParams,
    filters?: FilterParams
) => {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (filters?.symbol) where.symbol = { contains: filters.symbol, mode: 'insensitive' };
    if (filters?.exchange) where.exchange = filters.exchange;
    if (filters?.productType) where.productType = filters.productType;
    if (filters?.minQuantity) where.quantity = { gte: filters.minQuantity };
    if (filters?.maxQuantity) where.quantity = { lte: filters.maxQuantity };

    const [positions, total] = await Promise.all([
        prisma.position.findMany({
            where,
            skip,
            take: limit,
            orderBy: pagination?.sortBy ? {
                [pagination.sortBy]: pagination.sortOrder || 'asc'
            } : { marketValue: 'desc' }
        }),
        prisma.position.count({ where })
    ]);

    return {
        data: positions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

export const updatePosition = async (id: string, positionData: UpdatePositionData): Promise<PositionWithRelations> => {
    return prisma.position.update({
        where: { id },
        data: positionData,
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

export const deletePosition = async (id: string): Promise<void> => {
    await prisma.position.delete({
        where: { id }
    });
};

// Position calculations
export const updatePositionPnL = async (
    id: string,
    lastTradedPrice: number,
    dayChange: number,
    dayChangePct: number
) => {
    const position = await prisma.position.findUnique({
        where: { id },
        select: { quantity: true, averagePrice: true }
    });

    if (!position) {
        throw new Error('Position not found');
    }

    const marketValue = position.quantity * lastTradedPrice;
    const pnl = (lastTradedPrice - position.averagePrice) * position.quantity;

    return prisma.position.update({
        where: { id },
        data: {
            lastTradedPrice,
            marketValue,
            pnl,
            dayChange,
            dayChangePct,
            lastTradeDate: new Date()
        }
    });
};

// Balance management
export const getUserBalance = async (userId: string) => {
    return prisma.balance.findUnique({
        where: { userId },
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

export const updateUserBalance = async (
    userId: string,
    balanceData: Partial<Omit<Balance, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
) => {
    return prisma.balance.upsert({
        where: { userId },
        update: {
            ...balanceData,
            lastUpdated: new Date()
        },
        create: {
            userId,
            availableCash: 0,
            usedMargin: 0,
            totalBalance: 0,
            portfolioValue: 0,
            totalPnl: 0,
            dayPnl: 0,
            buyingPower: 0,
            marginUsed: 0,
            marginAvailable: 0,
            lastUpdated: new Date(),
            ...balanceData
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

// Portfolio analytics
export const getPortfolioSummary = async (userId: string) => {
    const [balance, positions, totalPnl, dayPnl] = await Promise.all([
        prisma.balance.findUnique({ where: { userId } }),
        prisma.position.findMany({ where: { userId } }),
        prisma.position.aggregate({
            where: { userId },
            _sum: { pnl: true, realizedPnl: true }
        }),
        prisma.position.aggregate({
            where: { userId },
            _sum: { dayChange: true }
        })
    ]);

    const totalMarketValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    const totalInvested = positions.reduce((sum, pos) => sum + (pos.averagePrice * Math.abs(pos.quantity)), 0);

    return {
        balance: balance || {
            availableCash: 0,
            totalBalance: 0,
            portfolioValue: 0,
            totalPnl: 0,
            dayPnl: 0,
            buyingPower: 0,
            marginUsed: 0,
            marginAvailable: 0
        },
        positions: positions.length,
        totalMarketValue,
        totalInvested,
        unrealizedPnl: totalPnl._sum.pnl || 0,
        realizedPnl: totalPnl._sum.realizedPnl || 0,
        dayPnl: dayPnl._sum.dayChange || 0,
        totalReturn: totalInvested > 0 ? ((totalMarketValue - totalInvested) / totalInvested) * 100 : 0
    };
};

export const getPortfolioPerformance = async (
    userId: string,
    startDate: Date,
    endDate: Date
) => {
    // Get historical trades for performance calculation
    const trades = await prisma.trade.findMany({
        where: {
            userId,
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        },
        orderBy: { createdAt: 'asc' },
        include: {
            order: {
                select: {
                    symbol: true,
                    side: true,
                    productType: true
                }
            }
        }
    });

    // Calculate daily P&L
    const dailyPnL: { [date: string]: number } = {};
    trades.forEach(trade => {
        const date = trade.createdAt.toISOString().split('T')[0];
        if (!dailyPnL[date]) dailyPnL[date] = 0;

        // Calculate P&L based on trade side
        const pnl = trade.order.side === 'BUY' ? -trade.netAmount : trade.netAmount;
        dailyPnL[date] += pnl;
    });

    return {
        trades: trades.length,
        totalPnl: trades.reduce((sum, trade) => {
            const pnl = trade.order.side === 'BUY' ? -trade.netAmount : trade.netAmount;
            return sum + pnl;
        }, 0),
        dailyPnL,
        winningDays: Object.values(dailyPnL).filter(pnlValue => pnlValue > 0).length,
        losingDays: Object.values(dailyPnL).filter(pnlValue => pnlValue < 0).length
    };
};

// Position aggregation
export const getPositionsBySymbol = async (userId: string) => {
    const positions = await prisma.position.findMany({
        where: { userId },
        orderBy: { symbol: 'asc' }
    });

    // Group by symbol
    const grouped = positions.reduce((acc, position) => {
        if (!acc[position.symbol]) {
            acc[position.symbol] = [];
        }
        acc[position.symbol].push(position);
        return acc;
    }, {} as { [symbol: string]: typeof positions });

    return grouped;
};

export const getPositionsByExchange = async (userId: string) => {
    const positions = await prisma.position.findMany({
        where: { userId },
        orderBy: { exchange: 'asc' }
    });

    // Group by exchange
    const grouped = positions.reduce((acc, position) => {
        if (!acc[position.exchange]) {
            acc[position.exchange] = [];
        }
        acc[position.exchange].push(position);
        return acc;
    }, {} as { [exchange: string]: typeof positions });

    return grouped;
};

// Risk metrics
export const getPortfolioRisk = async (userId: string) => {
    const positions = await prisma.position.findMany({
        where: { userId }
    });

    const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);

    // Calculate concentration risk
    const symbolConcentration = positions.reduce((acc, pos) => {
        const concentration = totalValue > 0 ? (pos.marketValue / totalValue) * 100 : 0;
        acc[pos.symbol] = concentration;
        return acc;
    }, {} as { [symbol: string]: number });

    // Find largest position
    const maxConcentration = Math.max(...Object.values(symbolConcentration));
    const diversificationScore = positions.length > 0 ? 100 - maxConcentration : 0;

    return {
        totalPositions: positions.length,
        totalValue,
        maxConcentration,
        diversificationScore,
        symbolConcentration,
        riskLevel: maxConcentration > 20 ? 'HIGH' : maxConcentration > 10 ? 'MEDIUM' : 'LOW'
    };
};

// Bulk operations
export const bulkUpdatePositions = async (
    positionIds: string[],
    updateData: Partial<UpdatePositionData>
) => {
    return prisma.position.updateMany({
        where: {
            id: { in: positionIds }
        },
        data: updateData
    });
};

export const closeAllPositions = async (userId: string) => {
    return prisma.position.deleteMany({
        where: { userId }
    });
}; 