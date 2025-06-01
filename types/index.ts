// Centralized type definitions for the trading frontend application
// This file consolidates all types and eliminates duplicates

// Re-export all service types that are the source of truth
export * from '@/services/types';

// tRPC types - these are the API contract types
import type { RouterOutputs, RouterInputs } from '@/lib/trpc/client';

// === CORE ENTITY TYPES (from tRPC, these are the actual API types) ===

// User types
export type User = RouterOutputs['user']['getById'];
export type UserProfile = RouterOutputs['user']['getProfile'];
export type UserStats = RouterOutputs['user']['getStats'];
export type CreateUserInput = RouterInputs['user']['create'];
export type UpdateUserInput = RouterInputs['user']['update'];

// Strategy types
export type Strategy = RouterOutputs['strategy']['getById'];
export type StrategyWithCounts = RouterOutputs['strategy']['getByUserId']['data'][0];
export type StrategyPerformance = RouterOutputs['strategy']['getPerformance'];
export type StrategyStats = RouterOutputs['strategy']['getStats'];
export type StrategyListResponse = RouterOutputs['strategy']['getByUserId'];
export type CreateStrategyInput = RouterInputs['strategy']['create'];
export type UpdateStrategyInput = RouterInputs['strategy']['update'];

// Order types
export type Order = RouterOutputs['order']['getById'];
export type OrderWithRelations = RouterOutputs['order']['getByUserId']['data'][0];
export type OrderStats = RouterOutputs['order']['getStats'];
export type OrderListResponse = RouterOutputs['order']['getByUserId'];
export type CreateOrderInput = RouterInputs['order']['create'];
export type UpdateOrderInput = RouterInputs['order']['update'];
export type CancelOrderInput = RouterInputs['order']['cancel'];

// Portfolio types
export type Position = RouterOutputs['portfolio']['getPositionById'];
export type PositionWithDetails = RouterOutputs['portfolio']['getPositionsByUserId']['data'][0];
export type Balance = RouterOutputs['portfolio']['getUserBalance'];
export type PortfolioSummary = RouterOutputs['portfolio']['getPortfolioSummary'];
export type PortfolioPerformance = RouterOutputs['portfolio']['getPortfolioPerformance'];
export type PortfolioRisk = RouterOutputs['portfolio']['getPortfolioRisk'];

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
export type StrategyFilters = RouterInputs['strategy']['getByUserId']['filters'];
export type OrderFilters = RouterInputs['order']['getByUserId']['filters'];
export type PositionFilters = RouterInputs['portfolio']['getPositionsByUserId']['filters'];

// Pagination types
export type PaginationParams = RouterInputs['strategy']['getByUserId']['pagination'];

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
  return user && 
         typeof user.id === 'string' && 
         typeof user.email === 'string' && 
         typeof user.username === 'string' &&
         typeof user.role === 'string';
}

export function isStrategy(item: any): item is Strategy {
  return item && 
         typeof item.id === 'string' && 
         typeof item.name === 'string' && 
         typeof item.userId === 'string';
}

export function isOrder(item: any): item is Order {
  return item && 
         typeof item.id === 'string' && 
         typeof item.symbol === 'string' && 
         typeof item.userId === 'string';
}

// === CONSTANTS ===

export const ORDER_STATUSES = [
  'PENDING',
  'PLACED', 
  'OPEN',
  'COMPLETE',
  'CANCELLED',
  'REJECTED',
  'ERROR'
] as const;

export const STRATEGY_STATUSES = [
  'DRAFT',
  'ACTIVE', 
  'PAUSED',
  'STOPPED',
  'ERROR',
  'BACKTESTING'
] as const;

export const ORDER_SIDES = ['BUY', 'SELL'] as const;
export const ORDER_TYPES = ['MARKET', 'LIMIT', 'SL', 'SL_M'] as const; 