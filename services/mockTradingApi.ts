// Mock Trading API Service for Development
// Returns sample data when backend is not available

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

class MockTradingApiService {
  private delay(ms: number = 500) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Health Check
  async getHealth(): Promise<HealthResponse> {
    await this.delay(200);
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database_connected: true,
      redis_connected: true,
      trading_system_active: true,
    };
  }

  // Strategies
  async getStrategies(): Promise<Strategy[]> {
    await this.delay(300);
    return [
      {
        id: "1",
        name: "Momentum Strategy",
        strategy_type: "MOMENTUM",
        symbols: ["AAPL", "GOOGL", "MSFT"],
        parameters: { lookback_period: 20, threshold: 0.02 },
        enabled: true,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
      },
      {
        id: "2",
        name: "Mean Reversion",
        strategy_type: "MEAN_REVERSION",
        symbols: ["TSLA", "NVDA"],
        parameters: { lookback_period: 14, threshold: 0.05 },
        enabled: false,
        created_at: "2024-01-10T09:00:00Z",
        updated_at: "2024-01-10T09:00:00Z",
      },
    ];
  }

  async getStrategyById(strategyId: string): Promise<Strategy> {
    await this.delay(200);
    const strategies = await this.getStrategies();
    const strategy = strategies.find((s) => s.id === strategyId);
    if (!strategy) throw new Error("Strategy not found");
    return strategy;
  }

  async createStrategy(
    strategyData: Omit<Strategy, "id" | "created_at" | "updated_at">
  ): Promise<Strategy> {
    await this.delay(400);
    return {
      ...strategyData,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async updateStrategy(
    strategyId: string,
    strategyData: Partial<Omit<Strategy, "id" | "created_at" | "updated_at">>
  ): Promise<Strategy> {
    await this.delay(300);
    const strategy = await this.getStrategyById(strategyId);
    return {
      ...strategy,
      ...strategyData,
      updated_at: new Date().toISOString(),
    };
  }

  async deleteStrategy(strategyId: string): Promise<{ message: string }> {
    await this.delay(200);
    return { message: "Strategy deleted successfully" };
  }

  async activateStrategy(strategyId: string): Promise<Strategy> {
    await this.delay(300);
    return this.updateStrategy(strategyId, { enabled: true });
  }

  async deactivateStrategy(strategyId: string): Promise<Strategy> {
    await this.delay(300);
    return this.updateStrategy(strategyId, { enabled: false });
  }

  async pauseStrategy(strategyId: string): Promise<Strategy> {
    await this.delay(300);
    return this.updateStrategy(strategyId, { enabled: false });
  }

  // User Strategy Configuration
  async getUserStrategyConfigs(userId: string): Promise<UserStrategyConfig[]> {
    await this.delay(300);
    return [
      {
        id: "1",
        user_id: userId,
        strategy_id: "1",
        enabled: true,
        risk_limits: { max_position_size: 1000 },
        order_preferences: { risk_level: "medium" },
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
      },
    ];
  }

  async updateUserStrategyConfig(
    userId: string,
    strategyId: string,
    configData: UpdateUserStrategyConfigRequest
  ): Promise<UserStrategyConfig> {
    await this.delay(300);
    return {
      id: "1",
      user_id: userId,
      strategy_id: strategyId,
      enabled: configData.enabled ?? true,
      risk_limits: configData.risk_limits ?? {},
      order_preferences: configData.order_preferences ?? {},
      created_at: "2024-01-15T10:00:00Z",
      updated_at: new Date().toISOString(),
    };
  }

  // Orders
  async getOrders(
    userId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<OrdersResponse> {
    await this.delay(400);
    const orders: Order[] = [
      {
        id: "1",
        user_id: userId,
        strategy_id: "1",
        symbol: "AAPL",
        side: "BUY",
        order_type: "MARKET",
        quantity: 100,
        price: 150.5,
        status: "COMPLETE",
        filled_quantity: 100,
        filled_price: 150.5,
        filled_at: "2024-01-15T10:30:05Z",
        timestamp: "2024-01-15T10:30:00Z",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:05Z",
      },
      {
        id: "2",
        user_id: userId,
        strategy_id: "2",
        symbol: "GOOGL",
        side: "SELL",
        order_type: "LIMIT",
        quantity: 50,
        price: 2800.0,
        status: "PENDING",
        filled_quantity: 0,
        timestamp: "2024-01-15T11:00:00Z",
        created_at: "2024-01-15T11:00:00Z",
        updated_at: "2024-01-15T11:00:00Z",
      },
    ];

    return {
      data: orders,
      total: orders.length,
      page: 1,
      totalPages: 1,
      limit: params?.limit || 50,
      offset: params?.offset || 0,
    };
  }

  async getOrderById(userId: string, orderId: string): Promise<Order> {
    await this.delay(200);
    const ordersResponse = await this.getOrders(userId);
    const order = ordersResponse.data.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");
    return order;
  }

  async placeOrder(userId: string, orderRequest: OrderRequest): Promise<Order> {
    await this.delay(500);
    return {
      id: Math.random().toString(36).substr(2, 9),
      user_id: userId,
      strategy_id: orderRequest.strategy_id,
      symbol: orderRequest.symbol,
      side: orderRequest.side,
      order_type: orderRequest.order_type,
      quantity: orderRequest.quantity,
      price: orderRequest.price,
      status: "PENDING",
      filled_quantity: 0,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async cancelOrder(
    userId: string,
    orderId: string
  ): Promise<{ message: string }> {
    await this.delay(300);
    return { message: "Order cancelled successfully" };
  }

  async getOrdersSummary(userId: string): Promise<OrdersSummary> {
    await this.delay(300);
    return {
      total_orders: 25,
      completed_orders: 20,
      open_orders: 3,
      cancelled_orders: 1,
      rejected_orders: 1,
      pending_orders: 2,
      total_value: 125000.5,
      status_breakdown: {
        COMPLETE: 20,
        PENDING: 2,
        CANCELLED: 1,
        REJECTED: 1,
        OPEN: 1,
      },
    };
  }

  // Positions
  async getPositions(userId: string): Promise<Position[]> {
    await this.delay(400);
    return [
      {
        id: "1",
        user_id: userId,
        symbol: "AAPL",
        exchange: "NASDAQ",
        quantity: 100,
        average_price: 150.5,
        market_value: 15275.0,
        pnl: 225.0,
        realized_pnl: 0,
        day_change: 1.5,
        day_change_pct: 1.0,
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T15:00:00Z",
      },
      {
        id: "2",
        user_id: userId,
        symbol: "GOOGL",
        exchange: "NASDAQ",
        quantity: 50,
        average_price: 2800.0,
        market_value: 137500.0,
        pnl: -2500.0,
        realized_pnl: 0,
        day_change: -1.8,
        day_change_pct: -1.3,
        created_at: "2024-01-10T09:00:00Z",
        updated_at: "2024-01-15T15:00:00Z",
      },
    ];
  }

  async getPositionById(userId: string, positionId: string): Promise<Position> {
    await this.delay(200);
    const positions = await this.getPositions(userId);
    const position = positions.find((p) => p.id === positionId);
    if (!position) throw new Error("Position not found");
    return position;
  }

  async squareOffPosition(
    userId: string,
    positionId: string
  ): Promise<{ message: string }> {
    await this.delay(400);
    return { message: "Position squared off successfully" };
  }

  async squareOffAllPositions(userId: string): Promise<{ message: string }> {
    await this.delay(600);
    return { message: "All positions squared off successfully" };
  }

  // Trades
  async getTrades(userId: string): Promise<Trade[]> {
    await this.delay(400);
    return [
      {
        id: "1",
        user_id: userId,
        order_id: "1",
        symbol: "AAPL",
        side: "BUY",
        quantity: 100,
        price: 150.5,
        net_amount: -15050.0,
        trade_timestamp: "2024-01-15T10:30:00Z",
        created_at: "2024-01-15T10:30:00Z",
      },
      {
        id: "2",
        user_id: userId,
        order_id: "2",
        symbol: "TSLA",
        side: "SELL",
        quantity: 25,
        price: 250.0,
        net_amount: 6247.5,
        trade_timestamp: "2024-01-14T14:20:00Z",
        created_at: "2024-01-14T14:20:00Z",
      },
    ];
  }

  async getTradeById(userId: string, tradeId: string): Promise<Trade> {
    await this.delay(200);
    const trades = await this.getTrades(userId);
    const trade = trades.find((t) => t.id === tradeId);
    if (!trade) throw new Error("Trade not found");
    return trade;
  }

  // Dashboard
  async getDashboardData(userId: string): Promise<DashboardData> {
    await this.delay(500);
    return {
      user_info: {
        user_id: userId,
        username: "demo_user",
        email: "demo@example.com",
        role: "trader",
        status: "active",
      },
      portfolio_summary: {
        total_value: 152775.0,
        day_change: -500.0,
        day_change_pct: -0.33,
        total_pnl: -2275.0,
        available_balance: 50000.0,
      },
      active_strategies: [
        {
          user_id: userId,
          strategy_id: "1",
          status: "ACTIVE",
          activated_at: "2024-01-15T10:00:00Z",
          allocation_amount: 10000,
          custom_parameters: { risk_level: "medium" },
          total_orders: 15,
          successful_orders: 12,
          total_pnl: 225.0,
        },
      ],
      recent_orders: [
        {
          id: "2",
          user_id: userId,
          strategy_id: "2",
          symbol: "GOOGL",
          side: "SELL",
          order_type: "LIMIT",
          quantity: 50,
          price: 2800.0,
          status: "PENDING",
          filled_quantity: 0,
          timestamp: "2024-01-15T11:00:00Z",
          created_at: "2024-01-15T11:00:00Z",
          updated_at: "2024-01-15T11:00:00Z",
        },
      ],
      system_status: {
        engine_running: true,
        total_users: 150,
        active_strategies: 25,
        total_orders: 1250,
        memory_usage_mb: 512,
        uptime_seconds: 86400,
      },
    };
  }
}

export const mockTradingApi = new MockTradingApiService();
