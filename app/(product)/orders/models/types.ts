import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export interface Order {
  id: string;
  userId: string;
  strategyId: string;
  symbol: string;
  exchange: string;
  side: string;
  orderType: string;
  productType: string;
  quantity: number;
  price: number;
  triggerPrice?: number;
  brokerOrderId?: string;
  status: string;
  statusMessage?: string;
  filledQuantity: number;
  averagePrice?: number;
  tags: string[];
  notes?: string;
  placedAt: Date;
  executedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  variety: string;
  parentOrderId?: string;
}

export interface SummaryStats {
  total_orders: number;
  total_value: number;
  open_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  rejected_orders: number;
  pending_orders: number;
  status_breakdown?: Record<string, number>;
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface FilterState {
  searchQuery: string;
  statusFilter: string;
  mode: string;
  startDate?: Date;
  endDate?: Date;
}

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface StatusConfig {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface StatusOption {
  label: string;
  value: string;
}

export interface ModeOption {
  label: string;
  value: string;
}

export interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  // Search and filters
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  // Actions
  onRefresh: () => void;
  onExport: () => void;
  highlightNewRows?: boolean;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  options?: number[];
}

// Constants
export const MODES: ModeOption[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "this_week" },
  { label: "Last Week", value: "last_week" },
  { label: "All", value: "all" },
];

export const STATUS_OPTIONS: StatusOption[] = [
  { label: "All Statuses", value: "all" },
  { label: "Placed", value: "PLACED" },
  { label: "Open", value: "OPEN" },
  { label: "Complete", value: "COMPLETE" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Failed", value: "FAILED" },
];

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  OPEN: { label: "Open", color: "bg-blue-100 text-blue-800", icon: Clock },
  COMPLETE: { label: "Complete", color: "bg-green-100 text-green-800", icon: CheckCircle },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-800", icon: XCircle },
  ERROR: { label: "Error", color: "bg-red-100 text-red-800", icon: AlertCircle },
  QUEUED: { label: "Queued", color: "bg-gray-100 text-gray-800", icon: Clock },
  UNKNOWN: { label: "Unknown", color: "bg-gray-100 text-gray-800", icon: AlertCircle },
}; 