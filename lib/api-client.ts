// API Client for Trading Frontend - Integrated with Trading Backend
import { tradingEngineApi } from "@/services/engine-api.service";
import { tradingWebSocket } from "@/services/websocket.service";
import EngineDataAdapter from "@/services/adapters/engine-data-adapter";
import { useState, useEffect, useCallback } from "react";

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
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the serialized params to avoid unnecessary re-renders
  const serializedParams = JSON.stringify(params);
  const isEnabled = options?.enabled !== false;

  const refetch = useCallback(async () => {
    if (!isEnabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await queryFn();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Unknown error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, isEnabled]);

  useEffect(() => {
    if (isEnabled) {
      refetch();
    }
  }, [serializedParams, isEnabled, refetch]);

  return { data, isLoading, error, refetch };
}

// Real API implementation using trading backend
export const trpc = {
  portfolio: {
    getUserBalance: {
      useQuery: (
        params: { userId: string },
        options?: { enabled?: boolean }
      ) => {
        return useApiQuery(
          async () => {
            // Get positions to calculate portfolio value
            const positionsResult = await tradingEngineApi.getPositions({
              user_id: params.userId,
              active_only: true,
            });

            if (!positionsResult.success || !positionsResult.data) {
              return { success: false, error: positionsResult.error };
            }

            const positions = positionsResult.data;
            const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);
            const portfolioValue = positions.reduce((sum, pos) => sum + pos.market_value, 0);

            return {
              success: true,
              data: {
                totalBalance: portfolioValue + 10000, // Assuming some cash balance
                totalPnl,
                portfolioValue,
                availableCash: 10000, // Mock available cash
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
                error: positionsResult.error || tradesResult.error 
              };
            }

            const positions = positionsResult.data || [];
            const trades = tradesResult.data || [];

            const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);
            const portfolioValue = positions.reduce((sum, pos) => sum + pos.market_value, 0);
            
            // Calculate realized P&L from trades
            const realizedPnl = trades.reduce((sum, trade) => {
              return sum + (trade.side === "SELL" ? trade.net_value : -trade.net_value);
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
                totalPages: Math.ceil(positions.length / params.pagination.limit),
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

            trades.forEach(trade => {
              const date = new Date(trade.timestamp).toISOString().split("T")[0];
              const tradePnl = trade.side === "SELL" ? trade.net_value : -trade.net_value;
              
              dailyPnL[date] = (dailyPnL[date] || 0) + tradePnl;
              totalPnl += tradePnl;
            });

            // Count winning/losing days
            Object.values(dailyPnL).forEach(dayPnl => {
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
            // Get user strategy configurations
            const result = await tradingEngineApi.getUserConfigsByUserId(params.userId);

            if (!result.success || !result.data) {
              return { success: false, error: result.error };
            }

            const userConfigs = result.data;
            
            // Get strategy details for each config
            const strategiesWithDetails = await Promise.all(
              userConfigs.map(async (config) => {
                const strategyResult = await tradingEngineApi.getStrategy(config.strategy_id);
                if (strategyResult.success && strategyResult.data) {
                  return {
                    id: config.strategy_id,
                    name: strategyResult.data.name,
                    totalTrades: 0, // Would need orders data
                    winRate: 0, // Would need trade analysis
                    status: config.enabled ? "ACTIVE" : "INACTIVE",
                    enabled: config.enabled,
                    maxOrderValue: config.max_order_value,
                    maxDailyOrders: config.max_daily_orders,
                    riskPercentage: config.risk_percentage,
                  };
                }
                return null;
              })
            );

            const validStrategies = strategiesWithDetails.filter(Boolean);

            return {
              success: true,
              data: {
                data: validStrategies,
                total: validStrategies.length,
                page: params.pagination.page,
                totalPages: Math.ceil(validStrategies.length / params.pagination.limit),
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
            const result = await tradingEngineApi.getOrders({
              user_id: params.userId,
              limit: params.pagination.limit,
              offset: (params.pagination.page - 1) * params.pagination.limit,
            });

            if (!result.success || !result.data) {
              return { success: false, error: result.error };
            }

            const orders = result.data.map(apiOrder => ({
              id: apiOrder.id,
              symbol: apiOrder.symbol,
              side: apiOrder.signal_type,
              quantity: apiOrder.quantity,
              price: apiOrder.price,
              status: apiOrder.status,
              timestamp: apiOrder.timestamp,
              filled_quantity: apiOrder.filled_quantity,
              filled_price: apiOrder.filled_price,
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
    const [resource, method] = endpoint.split('.');
    
    switch (resource) {
      case 'health':
        return await tradingEngineApi.getHealth();
      case 'strategies':
        if (method === 'list') return await tradingEngineApi.getStrategies();
        break;
      case 'orders':
        if (method === 'list') return await tradingEngineApi.getOrders();
        break;
      case 'positions':
        if (method === 'list') return await tradingEngineApi.getPositions();
        break;
      case 'trades':
        if (method === 'list') return await tradingEngineApi.getTrades();
        break;
    }
    
    return { success: false, error: `Unknown endpoint: ${endpoint}` };
  },
};
