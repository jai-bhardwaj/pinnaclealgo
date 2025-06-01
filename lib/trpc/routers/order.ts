import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import * as orderService from '@/services/order.service';
import { OrderStatus, OrderSide, OrderType, ProductType } from '@prisma/client';

// Input validation schemas
const createOrderSchema = z.object({
    user: z.object({
        connect: z.object({
            id: z.string(),
        }),
    }),
    strategy: z.object({
        connect: z.object({
            id: z.string(),
        }),
    }).optional(),
    symbol: z.string().min(1),
    exchange: z.string().min(1),
    side: z.nativeEnum(OrderSide),
    orderType: z.nativeEnum(OrderType),
    productType: z.nativeEnum(ProductType),
    quantity: z.number().positive(),
    price: z.number().positive().optional(),
    triggerPrice: z.number().positive().optional(),
    stopLoss: z.number().positive().optional(),
    takeProfit: z.number().positive().optional(),
    validity: z.string().optional().default('DAY'),
    isPaperTrade: z.boolean().optional().default(false),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

const updateOrderSchema = z.object({
    id: z.string(),
    quantity: z.number().positive().optional(),
    price: z.number().positive().optional(),
    triggerPrice: z.number().positive().optional(),
    stopLoss: z.number().positive().optional(),
    takeProfit: z.number().positive().optional(),
    validity: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

const paginationSchema = z.object({
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
});

const orderFiltersSchema = z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    side: z.nativeEnum(OrderSide).optional(),
    orderType: z.nativeEnum(OrderType).optional(),
    productType: z.nativeEnum(ProductType).optional(),
    symbol: z.string().optional(),
    strategyId: z.string().optional(),
    isPaperTrade: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export const orderRouter = createTRPCRouter({
    // Create order
    create: protectedProcedure
        .input(createOrderSchema)
        .mutation(async ({ input }) => {
            try {
                return await orderService.createOrder(input);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to create order',
                });
            }
        }),

    // Get order by ID
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const order = await orderService.getOrderById(input.id);
            if (!order) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Order not found',
                });
            }
            return order;
        }),

    // Get orders by user ID
    getByUserId: protectedProcedure
        .input(z.object({
            userId: z.string(),
            pagination: paginationSchema.optional(),
            filters: orderFiltersSchema.optional(),
        }))
        .query(async ({ input }) => {
            return await orderService.getOrdersByUserId(
                input.userId,
                input.pagination,
                input.filters
            );
        }),

    // Update order
    update: protectedProcedure
        .input(updateOrderSchema)
        .mutation(async ({ input }) => {
            const { id, ...updateData } = input;
            try {
                return await orderService.updateOrder(id, updateData);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to update order',
                });
            }
        }),

    // Delete order
    remove: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            try {
                await orderService.deleteOrder(input.id);
                return { success: true };
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to delete order',
                });
            }
        }),

    // Order status management
    place: protectedProcedure
        .input(z.object({
            id: z.string(),
            brokerOrderId: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            try {
                return await orderService.placeOrder(input.id, input.brokerOrderId);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to place order',
                });
            }
        }),

    execute: protectedProcedure
        .input(z.object({
            id: z.string(),
            filledQuantity: z.number().positive(),
            averagePrice: z.number().positive(),
            brokerOrderId: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            try {
                return await orderService.executeOrder(
                    input.id,
                    input.filledQuantity,
                    input.averagePrice,
                    input.brokerOrderId
                );
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to execute order',
                });
            }
        }),

    cancel: protectedProcedure
        .input(z.object({
            id: z.string(),
            reason: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            try {
                return await orderService.cancelOrder(input.id, input.reason);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to cancel order',
                });
            }
        }),

    reject: protectedProcedure
        .input(z.object({
            id: z.string(),
            reason: z.string(),
        }))
        .mutation(async ({ input }) => {
            try {
                return await orderService.rejectOrder(input.id, input.reason);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to reject order',
                });
            }
        }),

    // Order analytics
    getStats: protectedProcedure
        .input(z.object({
            userId: z.string().optional(),
            strategyId: z.string().optional(),
        }))
        .query(async ({ input }) => {
            return await orderService.getOrderStats(input.userId, input.strategyId);
        }),

    // Search orders
    search: protectedProcedure
        .input(z.object({
            query: z.string().min(1),
            filters: orderFiltersSchema.optional(),
        }))
        .query(async ({ input }) => {
            return await orderService.searchOrders(input.query, input.filters);
        }),

    // Bulk operations
    bulkUpdate: protectedProcedure
        .input(z.object({
            orderIds: z.array(z.string()),
            updateData: z.object({
                status: z.nativeEnum(OrderStatus).optional(),
                notes: z.string().optional(),
                tags: z.array(z.string()).optional(),
            }),
        }))
        .mutation(async ({ input }) => {
            try {
                return await orderService.bulkUpdateOrders(input.orderIds, input.updateData);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to bulk update orders',
                });
            }
        }),

    bulkCancel: protectedProcedure
        .input(z.object({
            orderIds: z.array(z.string()),
            reason: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
            try {
                return await orderService.bulkCancelOrders(input.orderIds, input.reason);
            } catch (error) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: error instanceof Error ? error.message : 'Failed to bulk cancel orders',
                });
            }
        }),

    // Order history
    getHistory: protectedProcedure
        .input(z.object({
            userId: z.string(),
            startDate: z.string(),
            endDate: z.string(),
            pagination: paginationSchema.optional(),
        }))
        .query(async ({ input }) => {
            return await orderService.getOrderHistory(
                input.userId,
                new Date(input.startDate),
                new Date(input.endDate),
                input.pagination
            );
        }),

    // Risk management helpers
    getOpenOrdersValue: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ input }) => {
            return await orderService.getOpenOrdersValue(input.userId);
        }),

    getOrdersBySymbol: protectedProcedure
        .input(z.object({
            userId: z.string(),
            symbol: z.string(),
        }))
        .query(async ({ input }) => {
            return await orderService.getOrdersBySymbol(input.userId, input.symbol);
        }),
}); 