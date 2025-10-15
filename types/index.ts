// Centralized type definitions for the trading frontend application
// This file consolidates all types and eliminates duplicates

// === TRADING BACKEND API TYPES (matching plan.md specification exactly) ===

// Health & Status
export interface HealthResponse {
  status: string;
  timestamp: string;
  database_connected: boolean;
  redis_connected: boolean;
  trading_system_active: boolean;
}

// Strategy Management
export interface Strategy {
  id: string;
  name: string;
  strategy_type: string;
  symbols: string[];
  parameters: Record<string, any>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Marketplace Strategy
export interface MarketplaceStrategy {
  strategy_id: string;
  name: string;
  description: string;
  category: string;
  risk_level: string;
  min_capital: number;
  expected_return_annual: number;
  max_drawdown: number;
  symbols: string[];
  parameters: Record<string, any>;
  is_active: boolean;
}

// Order Management
export interface Order {
  id: string;
  user_id: string;
  strategy_id: string;
  symbol: string;
  side: "BUY" | "SELL";
  order_type: "MARKET" | "LIMIT" | "STOP_LOSS";
  quantity: number;
  price?: number;
  status: string;
  broker_order_id?: string;
  filled_quantity: number;
  filled_price?: number;
  filled_at?: string;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface OrderRequest {
  user_id: string;
  strategy_id: string;
  symbol: string;
  side: "BUY" | "SELL";
  order_type: "MARKET" | "LIMIT" | "STOP_LOSS";
  quantity: number;
  price?: number;
  confidence?: number; // 0.0 to 1.0
}

export interface OrderResponse {
  order_id: string;
  status: string;
  broker_order_id?: string;
  message: string;
  error?: string;
}

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  offset: number;
}

export interface OrdersSummary {
  total_orders: number;
  total_value: number;
  open_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  rejected_orders: number;
  pending_orders: number;
  status_breakdown: Record<string, number>;
}

// Position Management
export interface Position {
  id: string;
  user_id: string;
  symbol: string;
  exchange: string;
  quantity: number;
  average_price: number;
  market_value: number;
  pnl: number; // Unrealized PnL
  realized_pnl: number;
  day_change: number;
  day_change_pct: number;
  created_at: string;
  updated_at: string;
}

// Trade Management
export interface Trade {
  id: string;
  user_id: string;
  order_id: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  net_amount: number;
  trade_timestamp?: string;
  created_at: string;
}

// User Strategy Configuration
export interface UserStrategyConfig {
  id: string;
  user_id: string;
  strategy_id: string;
  enabled: boolean;
  risk_limits?: Record<string, any>;
  order_preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserStrategyConfigRequest {
  enabled?: boolean;
  risk_limits?: {
    max_position_size?: number;
    max_daily_loss?: number;
  };
  order_preferences?: {
    default_quantity?: number;
    slippage_tolerance?: number;
  };
}

// Dashboard Data
export interface DashboardData {
  user_info: {
    user_id: string;
    username: string;
    email: string;
    role: string;
    status: string;
  };
  active_strategies: Array<{
    user_id: string;
    strategy_id: string;
    status: string;
    activated_at: string;
    allocation_amount: number;
    custom_parameters: Record<string, any>;
    total_orders: number;
    successful_orders: number;
    total_pnl: number;
  }>;
  recent_orders: Order[];
  portfolio_summary: {
    total_value: number;
    day_change: number;
    day_change_pct: number;
    total_pnl: number;
    available_balance: number;
  };
  system_status: {
    engine_running: boolean;
    total_users: number;
    active_strategies: number;
    total_orders: number;
    memory_usage_mb: number;
    uptime_seconds: number;
  };
}

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
    typeof item.strategy_type === "string"
  );
}

export function isOrder(item: any): item is Order {
  return (
    item &&
    typeof item.id === "string" &&
    typeof item.symbol === "string" &&
    typeof item.user_id === "string"
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
