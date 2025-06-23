import { makeAutoObservable, runInAction } from "mobx";
import { tradingEngineApi } from "@/services/engine-api.service";
import EngineDataAdapter from "@/services/adapters/engine-data-adapter";
import {
  classifyError,
  reportError,
  withRetry,
  type AppError,
  type ErrorContext,
} from "@/stores/utils/errorHandler";
import type { Order, StoreState } from "@/types";

// Define local types that match what the UI expects
interface OrderStats {
  total: number;
  pending: number;
  placed: number;
  completed: number;
  cancelled: number;
  rejected: number;
  totalValue: number;
  avgOrderSize: number;
}

interface OrderFilters {
  status?: string;
  side?: string;
  orderType?: string;
  symbol?: string;
  strategyId?: string;
  startDate?: string;
  endDate?: string;
}

export class EngineOrderStore implements StoreState {
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  lastError: AppError | null = null;

  // Orders data
  orders: Order[] = [];
  currentOrder: Order | null = null;
  ordersTotal = 0;
  ordersPage = 1;
  ordersLimit = 20;

  // Order statistics
  orderStats: OrderStats | null = null;

  // Search and filters
  searchQuery = "";
  filters: Partial<OrderFilters> = {
    status: undefined,
    side: undefined,
    orderType: undefined,
    symbol: undefined,
    strategyId: undefined,
    startDate: undefined,
    endDate: undefined,
  };

  constructor() {
    makeAutoObservable(this);

    // Initialize from stored tokens if available
    tradingEngineApi.initializeFromStorage();
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setSubmitting(submitting: boolean) {
    this.isSubmitting = submitting;
  }

  setError(error: string | null) {
    this.error = error;
  }

  setAppError(error: AppError | null) {
    this.lastError = error;
    this.error = error?.message || null;
  }

  clearError() {
    this.error = null;
    this.lastError = null;
  }

  // --- Actions using engine API with proper error handling ---

  async fetchUserDashboard() {
    this.setLoading(true);
    this.clearError();

    const context: ErrorContext = {
      action: "fetchUserDashboard",
      component: "EngineOrderStore",
    };

    try {
      const result = await withRetry(
        () => tradingEngineApi.getUserDashboard(),
        {
          maxAttempts: 3,
          onRetry: (attempt, error) => {
            console.log(
              `Retrying fetchUserDashboard (attempt ${attempt}):`,
              error.message
            );
          },
        }
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch user dashboard");
      }

      runInAction(() => {
        // Convert recent orders to frontend format
        const orders =
          result.data!.recent_orders?.map((engineOrder) =>
            EngineDataAdapter.engineOrderToFrontend(engineOrder)
          ) || [];

        this.orders = orders;
        this.ordersTotal = orders.length;

        // Calculate basic stats
        this.orderStats = this.calculateOrderStats(orders);
      });
    } catch (error: unknown) {
      const appError = classifyError(error, context);
      runInAction(() => {
        this.setAppError(appError);
      });
      reportError(appError);
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  async fetchOrders() {
    this.setLoading(true);
    this.clearError();

    const context: ErrorContext = {
      action: "fetchOrders",
      component: "EngineOrderStore",
    };

    try {
      const result = await withRetry(() => tradingEngineApi.getOrders(), {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          console.log(
            `Retrying fetchOrders (attempt ${attempt}):`,
            error.message
          );
        },
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch orders");
      }

      runInAction(() => {
        const orders = result.data!.map((engineOrder) =>
          EngineDataAdapter.engineOrderToFrontend(engineOrder)
        );

        this.orders = orders;
        this.ordersTotal = orders.length;
        this.orderStats = this.calculateOrderStats(orders);
      });
    } catch (error: unknown) {
      const appError = classifyError(error, context);
      runInAction(() => {
        this.setAppError(appError);
      });
      reportError(appError);
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  // Compatibility methods for existing UI components
  async fetchOrdersByUserId(userId: string, pagination?: any, filters?: any) {
    // For compatibility with existing UI
    await this.fetchUserDashboard();
  }

  async createOrder(orderData: Partial<Order>) {
    this.setSubmitting(true);
    this.clearError();

    const context: ErrorContext = {
      action: "createOrder",
      component: "EngineOrderStore",
    };

    try {
      // Convert frontend order to engine format
      const engineOrderData =
        EngineDataAdapter.frontendToEngineOrder(orderData);

      // Note: The engine API doesn't expose order creation directly
      // This would typically be handled by strategy execution
      console.log(
        "Order creation requested (handled by strategy execution):",
        engineOrderData
      );

      runInAction(() => {
        console.log("Order creation simulated successfully");
      });

      return { id: "simulated-order-id", ...orderData };
    } catch (error: unknown) {
      const appError = classifyError(error, context);
      runInAction(() => {
        this.setAppError(appError);
      });
      reportError(appError);
      throw appError;
    } finally {
      runInAction(() => {
        this.setSubmitting(false);
      });
    }
  }

  async updateOrder(id: string, orderData: Partial<Order>) {
    this.setSubmitting(true);
    this.clearError();

    try {
      // Engine doesn't support order updates directly
      console.log("Order update requested (not supported by engine):", {
        id,
        orderData,
      });

      runInAction(() => {
        const index = this.orders.findIndex((o) => o.id === id);
        if (index !== -1) {
          this.orders[index] = { ...this.orders[index], ...orderData };
        }
      });

      return { id, ...orderData };
    } catch (error: unknown) {
      const appError = classifyError(error, {
        action: "updateOrder",
        component: "EngineOrderStore",
      });
      runInAction(() => {
        this.setAppError(appError);
      });
      throw appError;
    } finally {
      runInAction(() => {
        this.setSubmitting(false);
      });
    }
  }

  async cancelOrder(id: string) {
    this.setSubmitting(true);
    this.clearError();

    try {
      // Engine doesn't expose order cancellation directly
      console.log(
        "Order cancellation requested (not supported by engine):",
        id
      );

      runInAction(() => {
        const index = this.orders.findIndex((o) => o.id === id);
        if (index !== -1) {
          this.orders[index].status = "CANCELLED" as any;
          this.orders[index].cancelledAt = new Date();
        }
      });

      return { id, status: "CANCELLED" };
    } catch (error: unknown) {
      const appError = classifyError(error, {
        action: "cancelOrder",
        component: "EngineOrderStore",
      });
      runInAction(() => {
        this.setAppError(appError);
      });
      throw appError;
    } finally {
      runInAction(() => {
        this.setSubmitting(false);
      });
    }
  }

  async bulkCancelOrders(orderIds: string[]) {
    this.setSubmitting(true);
    this.clearError();

    try {
      const promises = orderIds.map((id) => this.cancelOrder(id));
      await Promise.all(promises);
    } finally {
      runInAction(() => {
        this.setSubmitting(false);
      });
    }
  }

  // Helper method to calculate order stats
  private calculateOrderStats(orders: Order[]): OrderStats {
    const stats = {
      total: orders.length,
      pending: 0,
      placed: 0,
      completed: 0,
      cancelled: 0,
      rejected: 0,
      totalValue: 0,
      avgOrderSize: 0,
    };

    orders.forEach((order) => {
      switch (order.status) {
        case "PENDING":
          stats.pending++;
          break;
        case "PLACED":
        case "OPEN":
          stats.placed++;
          break;
        case "COMPLETE":
          stats.completed++;
          break;
        case "CANCELLED":
          stats.cancelled++;
          break;
        case "REJECTED":
        case "ERROR":
          stats.rejected++;
          break;
      }

      const orderValue = (order.price || 0) * order.quantity;
      stats.totalValue += orderValue;
    });

    stats.avgOrderSize = stats.total > 0 ? stats.totalValue / stats.total : 0;

    return stats;
  }

  // Setters and utility methods
  setCurrentOrder(order: Order | null) {
    this.currentOrder = order;
  }

  setOrders(orders: Order[], total?: number) {
    this.orders = orders;
    if (total !== undefined) {
      this.ordersTotal = total;
    }
    this.orderStats = this.calculateOrderStats(orders);
  }

  setOrderStats(stats: OrderStats | null) {
    this.orderStats = stats;
  }

  addOrder(order: Order) {
    this.orders.unshift(order); // Add to beginning
    this.ordersTotal += 1;
    this.orderStats = this.calculateOrderStats(this.orders);
  }

  updateOrderInList(updatedOrder: Order) {
    const index = this.orders.findIndex((o) => o.id === updatedOrder.id);
    if (index !== -1) {
      this.orders[index] = updatedOrder;
      this.orderStats = this.calculateOrderStats(this.orders);
    }
  }

  removeOrder(orderId: string) {
    this.orders = this.orders.filter((o) => o.id !== orderId);
    this.ordersTotal = Math.max(0, this.ordersTotal - 1);
    this.orderStats = this.calculateOrderStats(this.orders);
  }

  removeOrders(orderIds: string[]) {
    this.orders = this.orders.filter((o) => !orderIds.includes(o.id));
    this.ordersTotal = Math.max(0, this.ordersTotal - orderIds.length);
    this.orderStats = this.calculateOrderStats(this.orders);
  }

  setFilters(filters: Partial<typeof this.filters>) {
    this.filters = { ...this.filters, ...filters };
    this.ordersPage = 1; // Reset to first page when filters change
  }

  clearFilters() {
    this.filters = {
      status: undefined,
      side: undefined,
      orderType: undefined,
      symbol: undefined,
      strategyId: undefined,
      startDate: undefined,
      endDate: undefined,
    };
    this.ordersPage = 1;
  }

  setSearchQuery(query: string) {
    this.searchQuery = query;
    this.ordersPage = 1; // Reset to first page when search changes
  }

  setPage(page: number) {
    this.ordersPage = page;
  }

  setLimit(limit: number) {
    this.ordersLimit = limit;
    this.ordersPage = 1; // Reset to first page when limit changes
  }

  nextPage() {
    if (this.hasNextPage) {
      this.ordersPage += 1;
    }
  }

  previousPage() {
    if (this.hasPreviousPage) {
      this.ordersPage -= 1;
    }
  }

  get hasNextPage() {
    return this.ordersPage < this.totalPages;
  }

  get hasPreviousPage() {
    return this.ordersPage > 1;
  }

  get totalPages() {
    return Math.ceil(this.ordersTotal / this.ordersLimit);
  }

  get pendingOrders() {
    return this.orders.filter((o) => o.status === "PENDING");
  }

  get activeOrders() {
    return this.orders.filter((o) => ["PLACED", "OPEN"].includes(o.status));
  }

  get completedOrders() {
    return this.orders.filter((o) => o.status === "COMPLETE");
  }

  get cancelledOrders() {
    return this.orders.filter((o) => o.status === "CANCELLED");
  }

  get currentFilters() {
    return Object.entries(this.filters)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }

  get hasActiveFilters() {
    return Object.values(this.filters).some((value) => value !== undefined);
  }

  clear() {
    this.orders = [];
    this.currentOrder = null;
    this.orderStats = null;
    this.ordersTotal = 0;
    this.ordersPage = 1;
    this.searchQuery = "";
    this.clearFilters();
    this.clearError();
  }
}

export default EngineOrderStore;
