// Engine Data Adapter
// Transforms data between engine format and frontend format

import {
  Strategy,
  Order,
  User,
  StrategyStatus as FrontendStrategyStatus,
  OrderStatus as FrontendOrderStatus,
  OrderSide,
  OrderType,
  ProductType,
  AssetClass,
  TimeFrame,
} from "../types";

// Define missing types locally
interface StrategyWithCounts extends Strategy {
  _count: {
    orders: number;
    strategyLogs: number;
  };
}

interface StrategyPerformance {
  strategy_id: string;
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  avg_profit_per_trade: number;
  max_profit: number;
  max_loss: number;
  avg_trade_duration: number;
  best_day: number;
  worst_day: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown: number;
  total_fees: number;
  net_profit: number;
}

import type {
  EngineStrategy,
  UserStrategy,
  EngineOrder,
  LoginResponse,
} from "../engine-api.service";

import type {
  ApiOrder,
  ApiStrategy,
  ApiPosition,
  ApiTrade,
} from "@/types";

export class EngineDataAdapter {
  // Strategy Adapters
  static engineStrategyToFrontend(engineStrategy: EngineStrategy): Strategy {
    return {
      id: engineStrategy.strategy_id,
      userId: "", // Will be filled from context
      name: engineStrategy.name,
      description: engineStrategy.description || "",
      strategyType: engineStrategy.category,
      assetClass: this.mapAssetClass(engineStrategy.category),
      symbols: engineStrategy.symbols,
      timeframe: TimeFrame.MINUTE_5, // Default timeframe
      status: FrontendStrategyStatus.DRAFT,
      parameters: engineStrategy.parameters,
      riskParameters: {
        risk_level: engineStrategy.risk_level,
        min_capital: engineStrategy.min_capital,
        max_drawdown: engineStrategy.max_drawdown,
      },
      totalPnl: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      maxDrawdown: engineStrategy.max_drawdown,
      maxPositions: 1,
      capitalAllocated: engineStrategy.min_capital,
      startTime: "09:15",
      endTime: "15:30",
      activeDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastExecutedAt: undefined,
    };
  }

  static userStrategyToFrontend(
    userStrategy: UserStrategy,
    engineStrategy?: EngineStrategy
  ): StrategyWithCounts {
    const baseStrategy = engineStrategy
      ? this.engineStrategyToFrontend(engineStrategy)
      : this.createDefaultStrategy(userStrategy.strategy_id);

    return {
      ...baseStrategy,
      id: userStrategy.strategy_id,
      userId: userStrategy.user_id,
      status: this.mapStrategyStatus(userStrategy.status),
      totalPnl: userStrategy.total_pnl,
      totalTrades: userStrategy.total_orders,
      winningTrades: userStrategy.successful_orders,
      losingTrades: userStrategy.total_orders - userStrategy.successful_orders,
      winRate:
        userStrategy.total_orders > 0
          ? (userStrategy.successful_orders / userStrategy.total_orders) * 100
          : 0,
      capitalAllocated: userStrategy.allocation_amount,
      lastExecutedAt: userStrategy.activated_at
        ? new Date(userStrategy.activated_at)
        : undefined,
      parameters: {
        ...baseStrategy.parameters,
        ...userStrategy.custom_parameters,
      },
      _count: {
        orders: userStrategy.total_orders,
        strategyLogs: 0,
      },
    };
  }

  // Order Adapters
  static engineOrderToFrontend(engineOrder: EngineOrder): Order {
    return {
      id: engineOrder.order_id,
      userId: engineOrder.user_id,
      strategyId: engineOrder.strategy_id || undefined,
      symbol: engineOrder.symbol,
      exchange: "NSE", // Default exchange
      side: this.mapOrderSide(engineOrder.side),
      orderType: this.mapOrderType(engineOrder.order_type),
      productType: ProductType.INTRADAY, // Default product type
      quantity: engineOrder.quantity,
      price: engineOrder.price || undefined,
      triggerPrice: undefined,
      brokerOrderId: undefined,
      status: this.mapOrderStatus(engineOrder.status),
      statusMessage: undefined,
      filledQuantity: engineOrder.filled_quantity,
      averagePrice: engineOrder.average_price || undefined,
      tags: [],
      notes: undefined,
      placedAt: engineOrder.placed_at
        ? new Date(engineOrder.placed_at)
        : undefined,
      executedAt: engineOrder.executed_at
        ? new Date(engineOrder.executed_at)
        : undefined,
      cancelledAt: undefined,
      variety: "regular",
      parentOrderId: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  static apiOrderToFrontend(apiOrder: ApiOrder): Order {
    return {
      id: apiOrder.id,
      userId: apiOrder.user_id,
      strategyId: apiOrder.strategy_id || undefined,
      symbol: apiOrder.symbol,
      exchange: "NSE", // Default exchange
      side: this.mapApiOrderSide(apiOrder.signal_type),
      orderType: this.mapApiOrderType(apiOrder.order_type),
      productType: ProductType.INTRADAY, // Default product type
      quantity: apiOrder.quantity,
      price: apiOrder.price || undefined,
      triggerPrice: undefined,
      brokerOrderId: apiOrder.broker_order_id || undefined,
      status: this.mapApiOrderStatus(apiOrder.status),
      statusMessage: undefined,
      filledQuantity: apiOrder.filled_quantity || 0,
      averagePrice: apiOrder.filled_price || undefined,
      tags: [],
      notes: undefined,
      placedAt: new Date(apiOrder.timestamp),
      executedAt: apiOrder.filled_at ? new Date(apiOrder.filled_at) : undefined,
      cancelledAt: undefined,
      variety: "regular",
      parentOrderId: undefined,
      createdAt: new Date(apiOrder.timestamp),
      updatedAt: new Date(apiOrder.timestamp),
    };
  }

  // Performance Adapters
  static userStrategyToPerformance(
    userStrategy: UserStrategy
  ): StrategyPerformance {
    const winRate =
      userStrategy.total_orders > 0
        ? (userStrategy.successful_orders / userStrategy.total_orders) * 100
        : 0;

    return {
      strategy_id: userStrategy.strategy_id,
      total_pnl: userStrategy.total_pnl,
      total_trades: userStrategy.total_orders,
      winning_trades: userStrategy.successful_orders,
      losing_trades: userStrategy.total_orders - userStrategy.successful_orders,
      win_rate: winRate,
      avg_profit_per_trade:
        userStrategy.total_orders > 0
          ? userStrategy.total_pnl / userStrategy.total_orders
          : 0,
      max_profit: userStrategy.total_pnl > 0 ? userStrategy.total_pnl : 0,
      max_loss:
        userStrategy.total_pnl < 0 ? Math.abs(userStrategy.total_pnl) : 0,
      avg_trade_duration: 0, // Not available from engine
      best_day: userStrategy.total_pnl > 0 ? userStrategy.total_pnl : 0,
      worst_day: userStrategy.total_pnl < 0 ? userStrategy.total_pnl : 0,
      sharpe_ratio: 0, // Would need historical data
      sortino_ratio: 0, // Would need historical data
      max_drawdown: 0, // Would need historical data
      total_fees: 0, // Not available from engine
      net_profit: userStrategy.total_pnl,
    };
  }

  // User Adapters
  static loginResponseToUser(loginResponse: LoginResponse): Partial<User> {
    return {
      id: loginResponse.user_id,
      username: loginResponse.user_id, // Using user_id as username
      email: "", // Not provided by engine
      role: "USER" as any,
      status: "ACTIVE" as any,
      emailVerified: true,
    };
  }

  // Helper mapping functions
  private static mapStrategyStatus(
    engineStatus: string
  ): FrontendStrategyStatus {
    switch (engineStatus) {
      case "active":
        return FrontendStrategyStatus.ACTIVE;
      case "paused":
        return FrontendStrategyStatus.PAUSED;
      case "available":
        return FrontendStrategyStatus.DRAFT;
      default:
        return FrontendStrategyStatus.DRAFT;
    }
  }

  private static mapOrderStatus(engineStatus: string): FrontendOrderStatus {
    switch (engineStatus) {
      case "pending":
        return FrontendOrderStatus.PENDING;
      case "placed":
        return FrontendOrderStatus.PLACED;
      case "filled":
        return FrontendOrderStatus.COMPLETE;
      case "rejected":
        return FrontendOrderStatus.REJECTED;
      case "cancelled":
        return FrontendOrderStatus.CANCELLED;
      default:
        return FrontendOrderStatus.PENDING;
    }
  }

  private static mapOrderSide(engineSide: string): OrderSide {
    return engineSide === "BUY" ? OrderSide.BUY : OrderSide.SELL;
  }

  private static mapOrderType(engineType: string): OrderType {
    return engineType === "MARKET" ? OrderType.MARKET : OrderType.LIMIT;
  }

  private static mapApiOrderSide(signalType: "BUY" | "SELL"): OrderSide {
    return signalType === "BUY" ? OrderSide.BUY : OrderSide.SELL;
  }

  private static mapApiOrderType(orderType: "MARKET" | "LIMIT"): OrderType {
    return orderType === "MARKET" ? OrderType.MARKET : OrderType.LIMIT;
  }

  static mapApiOrderStatus(status: string): FrontendOrderStatus {
    switch (status) {
      case "PENDING":
        return FrontendOrderStatus.PENDING;
      case "PLACED":
        return FrontendOrderStatus.PLACED;
      case "OPEN":
        return FrontendOrderStatus.OPEN;
      case "COMPLETE":
        return FrontendOrderStatus.COMPLETE;
      case "CANCELLED":
        return FrontendOrderStatus.CANCELLED;
      case "REJECTED":
        return FrontendOrderStatus.REJECTED;
      case "ERROR":
        return FrontendOrderStatus.ERROR;
      case "QUEUED":
        return FrontendOrderStatus.QUEUED;
      case "UNKNOWN":
        return FrontendOrderStatus.UNKNOWN;
      case "FAILED":
        return FrontendOrderStatus.REJECTED;
      case "NULL":
      case "DEFAULT":
      default:
        return FrontendOrderStatus.UNKNOWN;
    }
  }

  private static mapAssetClass(category: string): AssetClass {
    // Map strategy categories to asset classes
    switch (category.toLowerCase()) {
      case "equity":
      case "swing":
      case "momentum":
        return AssetClass.EQUITY;
      case "derivatives":
      case "options":
      case "futures":
        return AssetClass.DERIVATIVES;
      case "crypto":
        return AssetClass.CRYPTO;
      case "commodities":
        return AssetClass.COMMODITIES;
      case "forex":
        return AssetClass.FOREX;
      default:
        return AssetClass.EQUITY;
    }
  }

  private static createDefaultStrategy(strategyId: string): Strategy {
    return {
      id: strategyId,
      userId: "",
      name: `Strategy ${strategyId}`,
      description: "",
      strategyType: "unknown",
      assetClass: AssetClass.EQUITY,
      symbols: [],
      timeframe: TimeFrame.MINUTE_5,
      status: FrontendStrategyStatus.DRAFT,
      parameters: {},
      riskParameters: {},
      totalPnl: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      maxDrawdown: 0,
      maxPositions: 1,
      capitalAllocated: 0,
      startTime: "09:15",
      endTime: "15:30",
      activeDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastExecutedAt: undefined,
    };
  }

  // Reverse adapters for sending data to engine
  static frontendToEngineStrategyActivation(
    strategyId: string,
    allocationAmount: number
  ): { strategy_id: string; allocation_amount: number } {
    return {
      strategy_id: strategyId,
      allocation_amount: allocationAmount,
    };
  }

  static frontendToEngineOrder(order: Partial<Order>): Partial<EngineOrder> {
    return {
      symbol: order.symbol || "",
      side: order.side === OrderSide.BUY ? "BUY" : "SELL",
      quantity: order.quantity || 0,
      order_type: order.orderType === OrderType.MARKET ? "MARKET" : "LIMIT",
      price: order.price || undefined,
    };
  }
}

export default EngineDataAdapter;

