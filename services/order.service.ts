import { prisma } from './prisma';
import { Order, OrderStatus, OrderSide, OrderType, ProductType, Prisma } from '@prisma/client';
import {
    PaginationParams,
    FilterParams,
} from './types';

// Use Prisma generated types for consistency
type OrderWithRelations = Order & {
    user?: any;
    strategy?: any;
    trades?: any[];
    parentOrder?: any;
    childOrders?: any[];
};

type CreateOrderData = Prisma.OrderCreateInput;
type UpdateOrderData = Prisma.OrderUpdateInput;

// Order CRUD operations
export const createOrder = async (orderData: CreateOrderData): Promise<OrderWithRelations> => {
    return prisma.order.create({
        data: {
            ...orderData,
            status: OrderStatus.PENDING,
            filledQuantity: 0,
            tags: orderData.tags || []
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            strategy: {
                select: {
                    id: true,
                    name: true,
                    strategyType: true
                }
            },
            trades: true
        }
    });
};

export const getOrderById = async (id: string): Promise<OrderWithRelations | null> => {
    return prisma.order.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            strategy: {
                select: {
                    id: true,
                    name: true,
                    strategyType: true
                }
            },
            trades: true,
            parentOrder: true,
            childOrders: true
        }
    });
};

export const getOrdersByUserId = async (
    userId: string,
    pagination?: PaginationParams,
    filters?: FilterParams
) => {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.side) where.side = filters.side;
    if (filters?.orderType) where.orderType = filters.orderType;
    if (filters?.productType) where.productType = filters.productType;
    if (filters?.symbol) where.symbol = { contains: filters.symbol, mode: 'insensitive' };
    if (filters?.strategyId) where.strategyId = filters.strategyId;
    if (filters?.isPaperTrade !== undefined) where.isPaperTrade = filters.isPaperTrade;

    if (filters?.startDate && filters?.endDate) {
        where.createdAt = {
            gte: new Date(filters.startDate),
            lte: new Date(filters.endDate)
        };
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            skip,
            take: limit,
            orderBy: pagination?.sortBy ? {
                [pagination.sortBy]: pagination.sortOrder || 'asc'
            } : { createdAt: 'desc' },
            include: {
                strategy: {
                    select: {
                        id: true,
                        name: true,
                        strategyType: true
                    }
                },
                trades: true,
                _count: {
                    select: {
                        trades: true,
                        childOrders: true
                    }
                }
            }
        }),
        prisma.order.count({ where })
    ]);

    return {
        data: orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

export const updateOrder = async (id: string, orderData: UpdateOrderData): Promise<OrderWithRelations> => {
    return prisma.order.update({
        where: { id },
        data: orderData,
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            strategy: {
                select: {
                    id: true,
                    name: true,
                    strategyType: true
                }
            },
            trades: true
        }
    });
};

export const deleteOrder = async (id: string): Promise<void> => {
    await prisma.order.delete({
        where: { id }
    });
};

// Order status management
export const placeOrder = async (id: string, brokerOrderId?: string) => {
    return prisma.order.update({
        where: { id },
        data: {
            status: OrderStatus.PLACED,
            placedAt: new Date(),
            brokerOrderId
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            strategy: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
};

export const executeOrder = async (
    id: string,
    filledQuantity: number,
    averagePrice: number,
    brokerOrderId?: string
) => {
    const order = await prisma.order.findUnique({
        where: { id },
        select: { quantity: true, filledQuantity: true }
    });

    if (!order) {
        throw new Error('Order not found');
    }

    const newFilledQuantity = order.filledQuantity + filledQuantity;
    const isComplete = newFilledQuantity >= order.quantity;

    return prisma.order.update({
        where: { id },
        data: {
            status: isComplete ? OrderStatus.COMPLETE : OrderStatus.OPEN,
            filledQuantity: newFilledQuantity,
            averagePrice,
            executedAt: isComplete ? new Date() : undefined,
            brokerOrderId: brokerOrderId || undefined
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            strategy: {
                select: {
                    id: true,
                    name: true
                }
            },
            trades: true
        }
    });
};

export const cancelOrder = async (id: string, reason?: string) => {
    return prisma.order.update({
        where: { id },
        data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
            statusMessage: reason
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            strategy: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
};

export const rejectOrder = async (id: string, reason: string) => {
    return prisma.order.update({
        where: { id },
        data: {
            status: OrderStatus.REJECTED,
            statusMessage: reason
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            strategy: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
};

// Order analytics
export const getOrderStats = async (userId?: string, strategyId?: string) => {
    const where: any = {};
    if (userId) where.userId = userId;
    if (strategyId) where.strategyId = strategyId;

    const [
        totalOrders,
        pendingOrders,
        placedOrders,
        completedOrders,
        cancelledOrders,
        rejectedOrders,
        totalVolume,
        avgOrderSize
    ] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.count({ where: { ...where, status: 'PENDING' } }),
        prisma.order.count({ where: { ...where, status: 'PLACED' } }),
        prisma.order.count({ where: { ...where, status: 'COMPLETE' } }),
        prisma.order.count({ where: { ...where, status: 'CANCELLED' } }),
        prisma.order.count({ where: { ...where, status: 'REJECTED' } }),
        prisma.order.aggregate({
            where: { ...where, status: 'COMPLETE' },
            _sum: { filledQuantity: true }
        }),
        prisma.order.aggregate({
            where: { ...where, status: 'COMPLETE' },
            _avg: { quantity: true }
        })
    ]);

    return {
        totalOrders,
        pendingOrders,
        placedOrders,
        completedOrders,
        cancelledOrders,
        rejectedOrders,
        totalVolume: totalVolume._sum.filledQuantity || 0,
        avgOrderSize: avgOrderSize._avg.quantity || 0,
        completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0
    };
};

// Order search and filtering
export const searchOrders = async (
    query: string,
    filters?: FilterParams
) => {
    const where: any = {
        OR: [
            { symbol: { contains: query, mode: 'insensitive' } },
            { brokerOrderId: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } }
        ]
    };

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;
    if (filters?.side) where.side = filters.side;

    return prisma.order.findMany({
        where,
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    email: true
                }
            },
            strategy: {
                select: {
                    id: true,
                    name: true,
                    strategyType: true
                }
            },
            trades: true
        }
    });
};

// Bulk operations
export const bulkUpdateOrders = async (
    orderIds: string[],
    updateData: Partial<UpdateOrderData>
) => {
    return prisma.order.updateMany({
        where: {
            id: { in: orderIds }
        },
        data: updateData
    });
};

export const bulkCancelOrders = async (orderIds: string[], reason?: string) => {
    return prisma.order.updateMany({
        where: {
            id: { in: orderIds },
            status: { in: ['PENDING', 'PLACED', 'OPEN'] }
        },
        data: {
            status: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
            statusMessage: reason
        }
    });
};

// Order history and reporting
export const getOrderHistory = async (
    userId: string,
    startDate: Date,
    endDate: Date,
    pagination?: PaginationParams
) => {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 100;
    const skip = (page - 1) * limit;

    const where = {
        userId,
        createdAt: {
            gte: startDate,
            lte: endDate
        }
    };

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                strategy: {
                    select: {
                        id: true,
                        name: true,
                        strategyType: true
                    }
                },
                trades: true
            }
        }),
        prisma.order.count({ where })
    ]);

    return {
        data: orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

// Risk management helpers
export const getOpenOrdersValue = async (userId: string) => {
    const openOrders = await prisma.order.findMany({
        where: {
            userId,
            status: { in: ['PENDING', 'PLACED', 'OPEN'] }
        },
        select: {
            quantity: true,
            price: true,
            filledQuantity: true
        }
    });

    return openOrders.reduce((total, order) => {
        const remainingQuantity = order.quantity - order.filledQuantity;
        const orderValue = remainingQuantity * (order.price || 0);
        return total + orderValue;
    }, 0);
};

export const getOrdersBySymbol = async (userId: string, symbol: string) => {
    return prisma.order.findMany({
        where: {
            userId,
            symbol
        },
        orderBy: { createdAt: 'desc' },
        include: {
            strategy: {
                select: {
                    id: true,
                    name: true
                }
            },
            trades: true
        }
    });
}; 