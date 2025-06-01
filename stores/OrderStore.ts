import { makeAutoObservable, runInAction } from 'mobx';
import { vanillaTrpc } from '@/lib/trpc/client';
import type {
    Order,
    OrderWithRelations,
    OrderStats, OrderFilters,
    StoreState
} from '@/types';

export class OrderStore implements StoreState {
    isLoading = false;
    isSubmitting = false;
    error: string | null = null;

    // Current order data
    currentOrder: Order | null = null;

    // Orders list - using the proper type from centralized types
    orders: OrderWithRelations[] = [];
    ordersTotal = 0;
    ordersPage = 1;
    ordersLimit = 10;

    // Order statistics
    orderStats: OrderStats | null = null;

    // Search and filters
    searchQuery = '';
    filters: Partial<OrderFilters> = {
        status: undefined,
        side: undefined,
        orderType: undefined,
        symbol: undefined,
        strategyId: undefined,
    };

    constructor() {
        makeAutoObservable(this);
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

    clearError() {
        this.error = null;
    }

    // --- Actions using tRPC ---

    async fetchOrders(userId: string) {
        this.setLoading(true);
        this.setError(null);
        try {
            const result = await vanillaTrpc.order.getByUserId.query({
                userId,
                pagination: { 
                    page: this.ordersPage, 
                    limit: this.ordersLimit 
                },
                filters: this.filters,
            });
            runInAction(() => {
                this.orders = result.data;
                this.ordersTotal = result.total;
            });
        } catch (error: any) {
            runInAction(() => {
                console.error('Failed to fetch orders:', error);
                this.setError(error.message || 'Failed to fetch orders');
            });
        } finally {
            runInAction(() => {
                this.setLoading(false);
            });
        }
    }

    async cancelOrder(orderId: string, reason?: string) {
         this.setSubmitting(true);
         this.setError(null);
         try {
             const result = await vanillaTrpc.order.cancel.mutate({ 
                id: orderId,
                reason 
             });
             runInAction(() => {
                 console.log('Order cancelled successfully:', result);
             });
             return result;
         } catch (error: any) {
             runInAction(() => {
                 console.error('Failed to cancel order:', error);
                 this.setError(error.message || 'Failed to cancel order');
             });
             throw error;
         } finally {
             runInAction(() => {
                 this.setSubmitting(false);
             });
         }
    }

    // --- Data setters (to be called from React components using tRPC hooks) ---
    setCurrentOrder(order: Order | null) {
        this.currentOrder = order;
    }

    setOrders(orders: OrderWithRelations[], total?: number) {
        this.orders = orders;
        if (total !== undefined) {
             this.ordersTotal = total;
        }
    }

    setOrderStats(stats: OrderStats | null) {
        this.orderStats = stats;
    }

    // --- Order management actions ---
    addOrder(order: OrderWithRelations) {
        this.orders.unshift(order);
        this.ordersTotal += 1;
    }

    updateOrderInList(updatedOrder: OrderWithRelations) {
        const index = this.orders.findIndex((order) => order.id === updatedOrder.id);
        if (index !== -1) {
            this.orders[index] = updatedOrder;
        }

        // Update current order if it's the same one - only if types are compatible
        if (this.currentOrder?.id === updatedOrder.id) {
            // Convert OrderWithRelations to Order format if needed
            this.currentOrder = {
                ...this.currentOrder,
                ...updatedOrder
            };
        }
    }

    removeOrder(orderId: string) {
        this.orders = this.orders.filter((order) => order.id !== orderId);
        this.ordersTotal = Math.max(0, this.ordersTotal - 1);

        // Clear current order if it was deleted
        if (this.currentOrder?.id === orderId) {
            this.currentOrder = null;
        }
    }

    removeOrders(orderIds: string[]) {
        this.orders = this.orders.filter((order) => !orderIds.includes(order.id));
        this.ordersTotal = Math.max(0, this.ordersTotal - orderIds.length);

        // Clear current order if it was deleted
        if (this.currentOrder && orderIds.includes(this.currentOrder.id)) {
            this.currentOrder = null;
        }
    }

    // --- Filters and pagination ---
    setFilters(filters: Partial<typeof this.filters>) {
        this.filters = { ...this.filters, ...filters };
        this.ordersPage = 1; // Reset to first page
        // Note: You'll need to pass userId when calling fetchOrders
        // this.fetchOrders(userId); // Fetch data with new filters
    }

    clearFilters() {
        this.filters = {
            status: undefined,
            side: undefined,
            orderType: undefined,
            symbol: undefined,
            strategyId: undefined,
        };
        this.searchQuery = '';
        this.ordersPage = 1;
        // Note: You'll need to pass userId when calling fetchOrders
        // this.fetchOrders(userId); // Fetch data after clearing filters
    }

    setSearchQuery(query: string) {
        this.searchQuery = query;
        this.ordersPage = 1; // Reset to first page
        // Note: You'll need to pass userId when calling fetchOrders
        // this.fetchOrders(userId); // Fetch data with new search query
    }

    setPage(page: number) {
        this.ordersPage = page;
        // Note: You'll need to pass userId when calling fetchOrders
        // this.fetchOrders(userId); // Fetch data for new page
    }

    setLimit(limit: number) {
        this.ordersLimit = limit;
        this.ordersPage = 1; // Reset to first page
        // Note: You'll need to pass userId when calling fetchOrders
        // this.fetchOrders(userId); // Fetch data with new limit
    }

    nextPage() {
        if (this.hasNextPage) {
            this.ordersPage += 1;
            // Note: You'll need to pass userId when calling fetchOrders
            // this.fetchOrders(userId); // Fetch data for next page
        }
    }

    previousPage() {
        if (this.hasPreviousPage) {
            this.ordersPage -= 1;
            // Note: You'll need to pass userId when calling fetchOrders
            // this.fetchOrders(userId); // Fetch data for previous page
        }
    }

    // --- Computed properties ---
    get hasNextPage() {
        return this.ordersPage * this.ordersLimit < this.ordersTotal;
    }

    get hasPreviousPage() {
        return this.ordersPage > 1;
    }

    get totalPages() {
        return Math.ceil(this.ordersTotal / this.ordersLimit);
    }

    get currentFilters() {
        return {
            ...this.filters,
            page: this.ordersPage,
            limit: this.ordersLimit,
            search: this.searchQuery.trim() !== '' ? this.searchQuery : undefined,
        };
    }

    get hasActiveFilters() {
        const filterValues = Object.values(this.filters || {});
        return filterValues.some(value => value !== undefined) || this.searchQuery.trim() !== '';
    }

    get pendingOrders() {
        return this.orders.filter((order) => order.status === 'PENDING');
    }

    get filledOrders() {
        return this.orders.filter((order) => order.status === 'COMPLETE');
    }

    get cancelledOrders() {
        return this.orders.filter((order) => order.status === 'CANCELLED');
    }

    get rejectedOrders() {
        return this.orders.filter((order) => order.status === 'REJECTED');
    }

    get openOrders() {
        return this.orders.filter((order) => order.status === 'OPEN');
    }

    // Order side filters
    get buyOrders() {
        return this.orders.filter((order) => order.side === 'BUY');
    }

    get sellOrders() {
        return this.orders.filter((order) => order.side === 'SELL');
    }

    // Order type filters
    get marketOrders() {
        return this.orders.filter((order) => order.orderType === 'MARKET');
    }

    get limitOrders() {
        return this.orders.filter((order) => order.orderType === 'LIMIT');
    }

    get stopLossOrders() {
        return this.orders.filter((order) => order.orderType === 'SL');
    }

    get stopLimitOrders() {
        return this.orders.filter((order) => order.orderType === 'SL_M');
    }

    // Order aggregations
    get ordersBySymbol() {
        const symbolMap = new Map<string, OrderWithRelations[]>();
        this.orders.forEach((order) => {
            const symbol = order.symbol;
            if (!symbolMap.has(symbol)) {
                symbolMap.set(symbol, []);
            }
            symbolMap.get(symbol)!.push(order);
        });
        return symbolMap;
    }

    get ordersByStrategy() {
        const strategyMap = new Map<string, OrderWithRelations[]>();
        this.orders.forEach((order) => {
            const strategyId = order.strategyId || 'manual';
            if (!strategyMap.has(strategyId)) {
                strategyMap.set(strategyId, []);
            }
            strategyMap.get(strategyId)!.push(order);
        });
        return strategyMap;
    }

    // Order value calculations
    get totalOrderValue() {
        return this.orders.reduce((total: number, order) => {
            return total + (order.quantity * (order.price || 0));
        }, 0);
    }

    get totalFilledValue() {
        return this.orders.reduce((total: number, order) => {
             return total + ((order.filledQuantity || 0) * (order.averagePrice || 0));
        }, 0);
    }

    get totalPendingValue() {
        return this.orders.reduce((total: number, order) => {
             // Calculate pending value based on unfilled quantity
             const pendingQuantity = order.quantity - (order.filledQuantity || 0);
             return total + (pendingQuantity * (order.price || 0));
        }, 0);
    }

    // Clear data
    clear() {
        this.currentOrder = null;
        this.orders = [];
        this.ordersTotal = 0;
        this.orderStats = null;
        this.clearFilters();
    }
} 