// API Client for Trading Frontend
import { PrismaClient } from "@prisma/client";

// Create Prisma client instance
const prisma = new PrismaClient();

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

// Mock tRPC-like object structure
export const trpc = {
  portfolio: {
    getUserBalance: {
      useQuery: (
        params: { userId: string },
        options?: { enabled?: boolean }
      ) => {
        return {
          data: {
            totalBalance: 50000,
            totalPnl: 2500,
            portfolioValue: 52500,
            availableCash: 10000,
          } as UserBalance,
          refetch: async () => ({}),
          isLoading: false,
        };
      },
    },
    getPortfolioSummary: {
      useQuery: (
        params: { userId: string },
        options?: { enabled?: boolean }
      ) => {
        return {
          data: {
            balance: {
              totalPnl: 2500,
              portfolioValue: 52500,
            },
            realizedPnl: 1500,
            unrealizedPnl: 1000,
            totalInvested: 50000,
          } as PortfolioSummary,
          refetch: async () => ({}),
          isLoading: false,
        };
      },
    },
    getPositionsByUserId: {
      useQuery: (
        params: { userId: string } & PaginatedRequest,
        options?: { enabled?: boolean }
      ) => {
        return {
          data: {
            data: [],
            total: 0,
            page: 1,
            totalPages: 0,
          } as PaginatedResponse<any>,
          refetch: async () => ({}),
          isLoading: false,
        };
      },
    },
    getPortfolioPerformance: {
      useQuery: (
        params: { userId: string; startDate: Date; endDate: Date },
        options?: { enabled?: boolean }
      ) => {
        return {
          data: {
            dailyPnL: Object.fromEntries(
              Array.from({ length: 30 }, (_, i) => {
                const date = new Date(
                  Date.now() - (29 - i) * 24 * 60 * 60 * 1000
                )
                  .toISOString()
                  .split("T")[0];
                return [date, Math.random() * 1000 - 500];
              })
            ),
            winningDays: 18,
            losingDays: 12,
            totalPnl: 2500,
            trades: 145,
          },
          refetch: async () => ({}),
          isLoading: false,
        };
      },
    },
  },
  strategy: {
    getByUserId: {
      useQuery: (
        params: { userId: string } & PaginatedRequest,
        options?: { enabled?: boolean }
      ) => {
        return {
          data: {
            data: [
              {
                id: "1",
                name: "Demo Strategy",
                totalTrades: 150,
                winRate: 65.5,
                status: "ACTIVE",
              },
            ],
            total: 1,
            page: 1,
            totalPages: 1,
          } as PaginatedResponse<any>,
          refetch: async () => ({}),
          isLoading: false,
        };
      },
    },
  },
  order: {
    getByUserId: {
      useQuery: (
        params: { userId: string } & PaginatedRequest,
        options?: { enabled?: boolean }
      ) => {
        return {
          data: {
            data: [
              {
                id: "1",
                symbol: "AAPL",
                side: "BUY",
                quantity: 100,
                price: 150.5,
                status: "OPEN",
              },
            ],
            total: 1,
            page: 1,
            totalPages: 1,
          } as PaginatedResponse<any>,
          refetch: async () => ({}),
          isLoading: false,
        };
      },
    },
  },
};

// Legacy compatibility exports
export const vanillaTrpc = trpc;
export type RouterOutputs = any;
export type RouterInputs = any;

// tRPC client for provider
export const trpcClient = {
  query: async (endpoint: string, params?: any) => {
    // Mock implementation
    return {};
  },
};
