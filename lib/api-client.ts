// API Client for Trading Frontend - Integrated with Trading Backend
import { tradingEngineApi } from "@/services/engine-api.service";
import { tradingWebSocket } from "@/services/websocket.service";
import EngineDataAdapter from "@/services/adapters/engine-data-adapter";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

// Types for API responses
export interface DashboardStats {
  totalBalance: number;
  totalPnL: number;
  activeStrategies: number;
  openOrders: number;
}

export interface UserBalance {
  totalBalance: number;
  totalPnl: number;
  portfolioValue: number;
  availableCash: number;
}

export interface PortfolioSummary {
  balance: {
    totalPnl: number;
    portfolioValue: number;
  };
  realizedPnl?: number;
  unrealizedPnl?: number;
  totalInvested?: number;
}

export interface PaginatedRequest {
  pagination: {
    page: number;
    limit: number;
    offset?: number;
  };
  filters?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// Helper hook for API queries
function useApiQuery<T>(
  queryFn: () => Promise<{ success: boolean; data?: T; error?: string }>,
  params: any,
  options?: { enabled?: boolean }
) {
  // Memoize the serialized params to avoid unnecessary re-renders
  const serializedParams = JSON.stringify(params);
  const isEnabled = options?.enabled !== false;

  // Use useQuery from react-query
  const {
    data: result,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [queryFn, serializedParams],
    queryFn: async () => {
      const res = await queryFn();
      if (!res.success) throw new Error(res.error || "Unknown error");
      return res.data as T;
    },
    enabled: isEnabled,
    refetchInterval: false, // polling handled by UI
    retry: false,
  });

  return {
    data: result,
    isLoading,
    isFetching,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

// Real API implementation using pinnacle-backend
export const trpc = {
  portfolio: {
    getUserBalance: {
      useQuery: (
        params: { userId: string },
        options?: { enabled?: boolean }
      ) => {
        return useApiQuery(
          async () => {
            // For now, return mock data since pinnacle-backend doesn't have positions/trades yet
            // This will be updated when those endpoints are implemented
            return {
              success: true,
              data: {
                totalBalance: 100000,
                totalPnl: 2500,
                portfolioValue: 97500,
                availableCash: 25000,
              } as UserBalance,
            };
          },
          params,
          options
        );
      },
    },
    getPortfolioSummary: {
      useQuery: (
        params: { userId: string },
        options?: { enabled?: boolean }
      ) => {
        return useApiQuery(
          async () => {
            // Get positions and trades for summary
            const [positionsResult, tradesResult] = await Promise.all([
              tradingEngineApi.getPositions({ user_id: params.userId }),
              tradingEngineApi.getTrades({ user_id: params.userId }),
            ]);

            if (!positionsResult.success || !tradesResult.success) {
              return {
                success: false,
                error: positionsResult.error || tradesResult.error,
              };
            }

            const positions = positionsResult.data || [];
            const trades = tradesResult.data || [];

            const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);
            const portfolioValue = positions.reduce(
              (sum, pos) => sum + pos.market_value,
              0
            );

            // Calculate realized P&L from trades
            const realizedPnl = trades.reduce((sum, trade) => {
              return (
                sum +
                (trade.side === "SELL" ? trade.net_value : -trade.net_value)
              );
            }, 0);

            const unrealizedPnl = totalPnl - realizedPnl;

            return {
              success: true,
              data: {
                balance: {
                  totalPnl,
                  portfolioValue,
                },
                realizedPnl,
                unrealizedPnl,
                totalInvested: portfolioValue - totalPnl,
              } as PortfolioSummary,
            };
          },
          params,
          options
        );
      },
    },
    getPositionsByUserId: {
      useQuery: (
        params: { userId: string } & PaginatedRequest,
        options?: { enabled?: boolean }
      ) => {
        return useApiQuery(
          async () => {
            const result = await tradingEngineApi.getPositions({
              user_id: params.userId,
              limit: params.pagination.limit,
              offset: (params.pagination.page - 1) * params.pagination.limit,
            });

            if (!result.success || !result.data) {
              return { success: false, error: result.error };
            }

            const positions = result.data;
            return {
              success: true,
              data: {
                data: positions,
                total: positions.length,
                page: params.pagination.page,
                totalPages: Math.ceil(
                  positions.length / params.pagination.limit
                ),
              } as PaginatedResponse<any>,
            };
          },
          params,
          options
        );
      },
    },
    getPortfolioPerformance: {
      useQuery: (
        params: { userId: string; startDate: Date; endDate: Date },
        options?: { enabled?: boolean }
      ) => {
        return useApiQuery(
          async () => {
            // Get trades within date range for performance calculation
            const result = await tradingEngineApi.getTrades({
              user_id: params.userId,
              start_date: params.startDate.toISOString(),
              end_date: params.endDate.toISOString(),
            });

            if (!result.success || !result.data) {
              return { success: false, error: result.error };
            }

            const trades = result.data;

            // Group trades by date for daily P&L calculation
            const dailyPnL: Record<string, number> = {};
            let totalPnl = 0;
            let winningDays = 0;
            let losingDays = 0;

            trades.forEach((trade) => {
              const date = new Date(trade.timestamp)
                .toISOString()
                .split("T")[0];
              const tradePnl =
                trade.side === "SELL" ? trade.net_value : -trade.net_value;

              dailyPnL[date] = (dailyPnL[date] || 0) + tradePnl;
              totalPnl += tradePnl;
            });

            // Count winning/losing days
            Object.values(dailyPnL).forEach((dayPnl) => {
              if (dayPnl > 0) winningDays++;
              else if (dayPnl < 0) losingDays++;
            });

            return {
              success: true,
              data: {
                dailyPnL,
                winningDays,
                losingDays,
                totalPnl,
                trades: trades.length,
              },
            };
          },
          params,
          options
        );
      },
    },
  },
  strategy: {
    getByUserId: {
      useQuery: (
        params: { userId: string } & PaginatedRequest,
        options?: { enabled?: boolean }
      ) => {
        return useApiQuery(
          async () => {
            // Get strategies from pinnacle-backend
            const result = await tradingEngineApi.getStrategies();

            if (!result.success || !result.data) {
              return { success: false, error: result.error };
            }

            const strategies = result.data.map((strategy: any) => ({
              id: strategy.id.toString(),
              name: strategy.name,
              totalTrades: 0, // Would need orders data
              winRate: 0, // Would need trade analysis
              status: strategy.enabled ? "ACTIVE" : "INACTIVE",
              enabled: strategy.enabled,
              strategyType: strategy.strategy_type,
              symbols: strategy.symbols || [],
              parameters: strategy.parameters || {},
            }));

            return {
              success: true,
              data: {
                data: strategies,
                total: strategies.length,
                page: params.pagination.page,
                totalPages: Math.ceil(
                  strategies.length / params.pagination.limit
                ),
              } as PaginatedResponse<any>,
            };
          },
          params,
          options
        );
      },
    },
  },
  order: {
    getByUserId: {
      useQuery: (
        params: { userId: string } & PaginatedRequest,
        options?: { enabled?: boolean }
      ) => {
        return useApiQuery(
          async () => {
            // Get orders from pinnacle-backend
            const result = await tradingEngineApi.getOrders({
              user_id: params.userId,
              limit: params.pagination.limit,
              offset: (params.pagination.page - 1) * params.pagination.limit,
            });

            if (!result.success || !result.data) {
              return { success: false, error: result.error };
            }

            const orders = result.data.map((apiOrder: any) => ({
              id: apiOrder.id.toString(),
              userId: apiOrder.user_id,
              strategyId: apiOrder.strategy_id?.toString(),
              symbol: apiOrder.symbol,
              exchange: "NSE", // Default exchange
              side: apiOrder.side,
              orderType: apiOrder.order_type,
              productType: "EQ", // Default product type
              quantity: apiOrder.quantity,
              price: apiOrder.price,
              triggerPrice: undefined,
              brokerOrderId: apiOrder.broker_order_id,
              status: apiOrder.status,
              statusMessage: undefined,
              filledQuantity: apiOrder.filled_quantity || 0,
              averagePrice: apiOrder.filled_price,
              tags: [],
              notes: undefined,
              placedAt: new Date(apiOrder.created_at),
              executedAt: apiOrder.filled_at
                ? new Date(apiOrder.filled_at)
                : undefined,
              cancelledAt: undefined,
              createdAt: new Date(apiOrder.created_at),
              updatedAt: new Date(apiOrder.updated_at),
              variety: "REGULAR",
              parentOrderId: undefined,
            }));

            return {
              success: true,
              data: {
                data: orders,
                total: orders.length,
                page: params.pagination.page,
                totalPages: Math.ceil(orders.length / params.pagination.limit),
              } as PaginatedResponse<any>,
            };
          },
          params,
          options
        );
      },
    },
    getSummary: {
      useQuery: (
        params: {
          userId: string;
          status?: string;
          start_date?: string;
          end_date?: string;
          symbol?: string;
        },
        options?: { enabled?: boolean }
      ) => {
        return useApiQuery(
          async () => {
            const result = await tradingEngineApi.getOrdersSummary({
              user_id: params.userId,
              status: params.status,
              start_date: params.start_date,
              end_date: params.end_date,
              symbol: params.symbol,
            });

            if (!result.success || !result.data) {
              return { success: false, error: result.error };
            }

            return {
              success: true,
              data: result.data,
            };
          },
          params,
          options
        );
      },
    },
  },
};

// Legacy compatibility exports
export const vanillaTrpc = trpc;
export type RouterOutputs = any;
export type RouterInputs = any;

// Real tRPC client using trading backend
export const trpcClient = {
  query: async (endpoint: string, params?: any) => {
    // Route to appropriate API endpoint based on tRPC-like endpoint structure
    const [resource, method] = endpoint.split(".");

    switch (resource) {
      case "health":
        return await tradingEngineApi.getHealth();
      case "strategies":
        if (method === "list") return await tradingEngineApi.getStrategies();
        break;
      case "orders":
        if (method === "list") return await tradingEngineApi.getOrders();
        break;
      case "positions":
        if (method === "list") return await tradingEngineApi.getPositions();
        break;
      case "trades":
        if (method === "list") return await tradingEngineApi.getTrades();
        break;
    }

    return { success: false, error: `Unknown endpoint: ${endpoint}` };
  },
};
