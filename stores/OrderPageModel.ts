import { makeAutoObservable, runInAction } from 'mobx';
import { tradingEngineApi } from '@/services/engine-api.service';
import { 
  Order, 
  SummaryStats, 
  PaginationState, 
  FilterState, 
  DateRange,
  MODES 
} from '@/types/orders';

function getDateRange(mode: string): DateRange {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  
  if (mode === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }
  if (mode === "this_week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    end.setDate(diff + 6);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }
  if (mode === "last_week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    end.setDate(diff + 6);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }
  return { startDate: undefined, endDate: undefined };
}

export class OrderPageModel {
  // State
  orders: Order[] = [];
  summaryStats: SummaryStats = {
    total_orders: 0,
    total_value: 0,
    open_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
    rejected_orders: 0,
    pending_orders: 0,
  };
  
  pagination: PaginationState = {
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    totalItems: 0,
  };
  
  filters: FilterState = {
    searchQuery: "",
    statusFilter: "all",
    mode: "today",
  };
  
  // Loading states
  isLoadingOrders = false;
  isLoadingSummary = false;
  isRefreshing = false;
  isManualRefresh = false;
  
  // Error states
  ordersError: string | null = null;
  summaryError: string | null = null;
  
  // User ID
  userId: string = "";
  
  constructor() {
    makeAutoObservable(this);
  }
  
  // Actions
  setUserId(userId: string) {
    this.userId = userId;
  }
  
  setSearchQuery(query: string) {
    this.filters.searchQuery = query;
    // Note: Search is handled client-side for better UX
  }
  
  setStatusFilter(status: string) {
    this.filters.statusFilter = status;
    this.pagination.currentPage = 1;
    this.fetchOrders();
    this.fetchSummary();
  }
  
  setMode(mode: string) {
    this.filters.mode = mode;
    this.pagination.currentPage = 1;
    this.fetchOrders();
    this.fetchSummary();
  }
  
  setPageSize(pageSize: number) {
    this.pagination.pageSize = pageSize;
    this.pagination.currentPage = 1;
    this.fetchOrders();
  }
  
  setCurrentPage(page: number) {
    this.pagination.currentPage = page;
    this.fetchOrders();
  }
  
  setRefreshing(refreshing: boolean) {
    this.isRefreshing = refreshing;
  }
  
  setManualRefresh(refreshing: boolean) {
    this.isManualRefresh = refreshing;
  }
  
  // Computed
  get dateRange(): DateRange {
    return getDateRange(this.filters.mode);
  }
  
  get filteredOrders(): Order[] {
    if (!this.filters.searchQuery) return this.orders;
    
    const query = this.filters.searchQuery.toLowerCase();
    return this.orders.filter(order => 
      order.symbol.toLowerCase().includes(query) ||
      order.id.toLowerCase().includes(query) ||
      order.strategyId.toLowerCase().includes(query)
    );
  }
  
  // API calls
  async fetchOrders() {
    if (!this.userId) return;
    
    this.isLoadingOrders = true;
    this.ordersError = null;
    
    try {
      const { startDate, endDate } = this.dateRange;
      
      const result = await tradingEngineApi.getOrders({
        user_id: this.userId,
        limit: this.pagination.pageSize,
        offset: (this.pagination.currentPage - 1) * this.pagination.pageSize,
        status: this.filters.statusFilter !== "all" ? this.filters.statusFilter as any : undefined,
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
      });
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch orders');
      }
      
      // Handle the response structure
      const responseData = result.data as unknown as {
        data: any[];
        total: number;
        page: number;
        totalPages: number;
        limit: number;
        offset: number;
      };
      
      const orders = responseData.data || [];
      
      const mappedOrders = orders.map((apiOrder: any) => ({
        id: apiOrder.id,
        userId: apiOrder.user_id,
        strategyId: apiOrder.strategy_id,
        symbol: apiOrder.symbol,
        exchange: "NSE",
        side: apiOrder.side,
        orderType: apiOrder.order_type,
        productType: "EQ",
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
        placedAt: new Date(apiOrder.timestamp),
        executedAt: apiOrder.filled_at ? new Date(apiOrder.filled_at) : undefined,
        cancelledAt: undefined,
        createdAt: new Date(apiOrder.timestamp),
        updatedAt: new Date(apiOrder.timestamp),
        variety: "REGULAR",
        parentOrderId: undefined,
      }));
      
      runInAction(() => {
        this.orders = mappedOrders;
        this.pagination.totalItems = responseData.total || 0;
        this.pagination.totalPages = responseData.totalPages || 1;
        this.pagination.currentPage = responseData.page || 1;
        this.isLoadingOrders = false;
      });
      
    } catch (error) {
      runInAction(() => {
        this.ordersError = error instanceof Error ? error.message : 'Failed to fetch orders';
        this.isLoadingOrders = false;
      });
    }
  }
  
  async fetchSummary() {
    if (!this.userId) return;
    
    this.isLoadingSummary = true;
    this.summaryError = null;
    
    try {
      const { startDate, endDate } = this.dateRange;
      
      const result = await tradingEngineApi.getOrdersSummary({
        user_id: this.userId,
        status: this.filters.statusFilter !== "all" ? this.filters.statusFilter : undefined,
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
      });
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch summary');
      }
      
      runInAction(() => {
        this.summaryStats = result.data;
        this.isLoadingSummary = false;
      });
      
    } catch (error) {
      runInAction(() => {
        this.summaryError = error instanceof Error ? error.message : 'Failed to fetch summary';
        this.isLoadingSummary = false;
      });
    }
  }
  
  async refresh() {
    this.setRefreshing(true);
    this.setManualRefresh(true);
    
    try {
      await Promise.all([this.fetchOrders(), this.fetchSummary()]);
    } finally {
      setTimeout(() => this.setRefreshing(false), 1000);
      setTimeout(() => this.setManualRefresh(false), 500);
    }
  }
  
  // Initialize
  async initialize(userId: string) {
    this.setUserId(userId);
    await Promise.all([this.fetchOrders(), this.fetchSummary()]);
  }
}

// Create singleton instance
export const orderPageModel = new OrderPageModel(); 