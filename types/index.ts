// Centralized type definitions for the trading frontend application
// This file consolidates all types and eliminates duplicates

// Re-export all service types that are the source of truth
// export * from '@/services/types'; // Commented out as services may not exist

// API Client types - these are the API contract types
import type { RouterOutputs, RouterInputs } from "@/lib/trpc/client";

// === FASTAPI BACKEND TYPES (matching API documentation exactly) ===

// Health & Status
export interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  version: string;
}

export interface DetailedHealthResponse extends HealthResponse {
  components: {
    database: {
      status: "healthy" | "unhealthy";
      response_time_ms: number;
    };
    trading_engine: {
      status: "healthy" | "unhealthy";
      active_strategies: number;
      orders_today: number;
      success_rate: number;
    };
    market_data: {
      status: "healthy" | "unhealthy";
      last_update: string;
    };
  };
  system: {
    uptime_seconds: number;
    memory_usage_mb: number;
    cpu_usage_percent: number;
  };
}

// Strategy Management
export interface ApiStrategy {
  id: string;
  name: string;
  class_name: string;
  enabled: boolean;
  symbols: string[];
  parameters: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateStrategyRequest {
  name: string;
  class_name: string;
  enabled: boolean;
  symbols: string[];
  parameters: Record<string, any>;
}

export interface UpdateStrategyRequest extends Partial<CreateStrategyRequest> {}

// Strategy update data interface for frontend
export interface StrategyUpdateData {
  name?: string;
  description?: string;
  enabled?: boolean;
  parameters?: Record<string, unknown>;
  risk_parameters?: Record<string, unknown>;
  max_drawdown?: number;
  max_positions?: number;
}

// User Strategy Configuration
export interface ApiUserConfig {
  id: string;
  user_id: string;
  strategy_id: string;
  enabled: boolean;
  max_order_value: number;
  max_daily_orders: number;
  risk_percentage: number;
  order_preferences: {
    default_quantity?: number;
    order_type?: string;
    stop_loss_percentage?: number;
    take_profit_percentage?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateUserConfigRequest {
  user_id: string;
  strategy_id: string;
  enabled: boolean;
  max_order_value: number;
  max_daily_orders: number;
  risk_percentage: number;
  order_preferences: {
    default_quantity?: number;
    order_type?: string;
    stop_loss_percentage?: number;
    take_profit_percentage?: number;
  };
}

export interface UpdateUserConfigRequest
  extends Partial<CreateUserConfigRequest> {}

// Order Management
export interface ApiOrder {
  id: string;
  user_id: string;
  strategy_id?: string;
  symbol: string;
  signal_type: "BUY" | "SELL";
  quantity: number;
  price: number;
  order_type: "MARKET" | "LIMIT";
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  broker_order_id?: string;
  filled_quantity?: number;
  filled_price?: number;
  timestamp: string;
  filled_at?: string;
  metadata?: Record<string, any>;
}

export interface CreateOrderRequest {
  user_id: string;
  strategy_id?: string;
  symbol: string;
  signal_type: "BUY" | "SELL";
  quantity: number;
  price?: number;
  order_type: "MARKET" | "LIMIT";
  metadata?: Record<string, any>;
}

// Position Management
export interface ApiPosition {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  average_price: number;
  current_price: number;
  market_value: number;
  pnl: number;
  pnl_percentage: number;
  created_at: string;
  updated_at: string;
}

// Trade Management
export interface ApiTrade {
  id: string;
  user_id: string;
  order_id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  value: number;
  commission: number;
  taxes: number;
  net_value: number;
  trade_id?: string;
  exchange: string;
  timestamp: string;
}

// WebSocket Event Types
export interface OrderUpdateEvent {
  type: "order_update";
  data: {
    id: string;
    status: ApiOrder["status"];
    filled_quantity?: number;
    filled_price?: number;
    filled_at?: string;
  };
}

export interface PositionUpdateEvent {
  type: "position_update";
  data: {
    id: string;
    symbol: string;
    quantity: number;
    current_price: number;
    pnl: number;
  };
}

export interface StrategyUpdateEvent {
  type: "strategy_update";
  data: {
    id: string;
    name: string;
    enabled: boolean;
    updated_at: string;
  };
}

export interface TradeUpdateEvent {
  type: "trade_update";
  data: {
    id: string;
    symbol: string;
    quantity: number;
    price: number;
    timestamp: string;
  };
}

export type WebSocketEvent =
  | OrderUpdateEvent
  | PositionUpdateEvent
  | StrategyUpdateEvent
  | TradeUpdateEvent;

// API Error Response
export interface ApiErrorResponse {
  detail: string;
  error_code?: string;
  timestamp: string;
}

// Query Parameters for list endpoints
export interface StrategyListParams {
  enabled?: boolean;
  limit?: number;
  offset?: number;
}

export interface UserConfigListParams {
  user_id?: string;
  strategy_id?: string;
  enabled?: boolean;
}

export interface OrderListParams {
  user_id?: string;
  strategy_id?: string;
  symbol?: string;
  status?: ApiOrder["status"];
  signal_type?: "BUY" | "SELL";
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface PositionListParams {
  user_id?: string;
  symbol?: string;
  active_only?: boolean;
  limit?: number;
  offset?: number;
}

export interface TradeListParams {
  user_id?: string;
  symbol?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

// === CORE ENTITY TYPES (from tRPC, these are the actual API types) ===

// User types
export type User = RouterOutputs["user"]["getById"];
export type UserProfile = RouterOutputs["user"]["getProfile"];
export type UserStats = RouterOutputs["user"]["getStats"];
export type CreateUserInput = RouterInputs["user"]["create"];
export type UpdateUserInput = RouterInputs["user"]["update"];

// Strategy types
export type Strategy = RouterOutputs["strategy"]["getById"];
export type StrategyWithCounts =
  RouterOutputs["strategy"]["getByUserId"]["data"][0];
export type StrategyPerformance = RouterOutputs["strategy"]["getPerformance"];
export type StrategyStats = RouterOutputs["strategy"]["getStats"];
export type StrategyListResponse = RouterOutputs["strategy"]["getByUserId"];
export type CreateStrategyInput = RouterInputs["strategy"]["create"];
export type UpdateStrategyInput = RouterInputs["strategy"]["update"];

// Order types
export type Order = RouterOutputs["order"]["getById"];
export type OrderWithRelations =
  RouterOutputs["order"]["getByUserId"]["data"][0];
export type OrderStats = RouterOutputs["order"]["getStats"];
export type OrderListResponse = RouterOutputs["order"]["getByUserId"];
export type CreateOrderInput = RouterInputs["order"]["create"];
export type UpdateOrderInput = RouterInputs["order"]["update"];
export type CancelOrderInput = RouterInputs["order"]["cancel"];

// Portfolio types
export type Position = RouterOutputs["portfolio"]["getPositionById"];
export type PositionWithDetails =
  RouterOutputs["portfolio"]["getPositionsByUserId"]["data"][0];
export type Balance = RouterOutputs["portfolio"]["getUserBalance"];
export type PortfolioSummary =
  RouterOutputs["portfolio"]["getPortfolioSummary"];
export type PortfolioPerformance =
  RouterOutputs["portfolio"]["getPortfolioPerformance"];
export type PortfolioRisk = RouterOutputs["portfolio"]["getPortfolioRisk"];

// === APPLICATION-SPECIFIC TYPES ===

// NextAuth extended user type
export interface ExtendedUser {
  id: string;
  email: string;
  username: string;
  role: string;
  name?: string;
}

// UI State types
export interface DashboardStats {
  totalBalance: number;
  totalPnL: number;
  activeStrategies: number;
  openOrders: number;
}

export interface PnLData {
  date: string;
  dailyPnL: number;
  cumulativePnL: number;
  trades: number;
}

// Component prop types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface TableProps<T> {
  data: T[];
  isLoading: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

// Filter types for API calls
export type StrategyFilters =
  RouterInputs["strategy"]["getByUserId"]["filters"];
export type OrderFilters = RouterInputs["order"]["getByUserId"]["filters"];
export type PositionFilters =
  RouterInputs["portfolio"]["getPositionsByUserId"]["filters"];

// Pagination types
export type PaginationParams =
  RouterInputs["strategy"]["getByUserId"]["pagination"];

// === FORM TYPES ===

// Form data types for create/update operations
export interface StrategyFormData {
  name: string;
  description?: string;
  strategyType: string;
  assetClass: string;
  symbols: string[];
  timeframe: string;
  parameters: Record<string, unknown>;
  riskParameters: Record<string, unknown>;
  capitalAllocated: number;
  maxPositions: number;
  startTime?: string;
  endTime?: string;
  activeDays: string[];
}

export interface OrderFormData {
  symbol: string;
  exchange: string;
  side: string;
  orderType: string;
  productType: string;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  variety: string;
  tags?: string[];
  notes?: string;
}

// === UTILITY TYPES ===

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Loading state
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Store state types
export interface StoreState extends LoadingState {
  isSubmitting: boolean;
}

// === TYPE GUARDS ===

export function isExtendedUser(user: any): user is ExtendedUser {
  return (
    user &&
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    typeof user.username === "string" &&
    typeof user.role === "string"
  );
}

export function isStrategy(item: any): item is Strategy {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.userId === "string"
  );
}

export function isOrder(item: any): item is Order {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.symbol === "string" &&
    typeof item.userId === "string"
  );
}

// === CONSTANTS ===

export const ORDER_STATUSES = [
  "PENDING",
  "PLACED",
  "OPEN",
  "COMPLETE",
  "CANCELLED",
  "REJECTED",
  "ERROR",
] as const;

export const STRATEGY_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "STOPPED",
  "ERROR",
  "BACKTESTING",
] as const;

export const ORDER_SIDES = ["BUY", "SELL"] as const;
export const ORDER_TYPES = ["MARKET", "LIMIT", "SL", "SL_M"] as const;
