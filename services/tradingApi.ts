// Trading Backend API Service
// Implements all endpoints from plan.md specification

import type {
  HealthResponse,
  Strategy,
  MarketplaceStrategy,
  Order,
  OrderRequest,
  OrderResponse,
  OrdersResponse,
  OrdersSummary,
  Position,
  Trade,
  UserStrategyConfig,
  UpdateUserStrategyConfigRequest,
  DashboardData,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class TradingApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "API request failed");
    }

    return response.json();
  }

  // === HEALTH & SYSTEM ===

  async checkHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/api/health");
  }

  // === STRATEGIES ===

  async getStrategies(): Promise<Strategy[]> {
    return this.request<Strategy[]>("/api/strategies/");
  }

  async getStrategy(strategyId: string): Promise<Strategy> {
    return this.request<Strategy>(`/api/strategies/${strategyId}`);
  }

  // === MARKETPLACE ===

  async getMarketplace(): Promise<MarketplaceStrategy[]> {
    return this.request<MarketplaceStrategy[]>("/api/marketplace/");
  }

  // === ORDERS ===

  async placeOrder(orderData: OrderRequest): Promise<OrderResponse> {
    return this.request<OrderResponse>("/api/orders/", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  async getUserOrders(
    userId: string,
    params?: {
      limit?: number;
      offset?: number;
      status?: string;
      start_date?: string;
      end_date?: string;
      symbol?: string;
    }
  ): Promise<OrdersResponse> {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return this.request<OrdersResponse>(
      `/api/orders/${userId}${queryString ? `?${queryString}` : ""}`
    );
  }

  async getOrdersSummary(
    userId: string,
    params?: {
      status?: string;
      start_date?: string;
      end_date?: string;
      symbol?: string;
    }
  ): Promise<OrdersSummary> {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return this.request<OrdersSummary>(
      `/api/orders/${userId}/summary${queryString ? `?${queryString}` : ""}`
    );
  }

  // === POSITIONS ===

  async getPositions(userId: string): Promise<Position[]> {
    return this.request<Position[]>(`/api/positions/${userId}`);
  }

  async getPosition(userId: string, symbol: string): Promise<Position> {
    return this.request<Position>(`/api/positions/${userId}/${symbol}`);
  }

  // === TRADES ===

  async getTrades(userId: string): Promise<Trade[]> {
    return this.request<Trade[]>(`/api/trades/${userId}`);
  }

  async getTradesBySymbol(userId: string, symbol: string): Promise<Trade[]> {
    return this.request<Trade[]>(`/api/trades/${userId}/symbol/${symbol}`);
  }

  // === USER STRATEGY CONFIGS ===

  async getUserConfigs(userId: string): Promise<UserStrategyConfig[]> {
    return this.request<UserStrategyConfig[]>(`/api/user-configs/${userId}`);
  }

  async getUserConfig(
    userId: string,
    strategyId: string
  ): Promise<UserStrategyConfig> {
    return this.request<UserStrategyConfig>(
      `/api/user-configs/${userId}/${strategyId}`
    );
  }

  async updateUserConfig(
    userId: string,
    strategyId: string,
    config: UpdateUserStrategyConfigRequest
  ): Promise<UserStrategyConfig> {
    return this.request<UserStrategyConfig>(
      `/api/user-configs/${userId}/${strategyId}`,
      {
        method: "PUT",
        body: JSON.stringify(config),
      }
    );
  }

  // === USER DASHBOARD ===

  async getDashboard(userId: string): Promise<DashboardData> {
    return this.request<DashboardData>(`/users/${userId}/dashboard`);
  }

  async activateStrategy(
    strategyId: string,
    allocationAmount?: number
  ): Promise<any> {
    const params = allocationAmount
      ? `?allocation_amount=${allocationAmount}`
      : "";
    return this.request(`/api/user/activate/${strategyId}${params}`, {
      method: "POST",
    });
  }

  async deactivateStrategy(strategyId: string): Promise<any> {
    return this.request(`/api/user/deactivate/${strategyId}`, {
      method: "POST",
    });
  }

  async pauseStrategy(strategyId: string): Promise<any> {
    return this.request(`/api/user/pause/${strategyId}`, {
      method: "POST",
    });
  }

  async resumeStrategy(strategyId: string): Promise<any> {
    return this.request(`/api/user/resume/${strategyId}`, {
      method: "POST",
    });
  }
}

export const tradingApi = new TradingApiService();
