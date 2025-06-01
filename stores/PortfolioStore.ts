import { makeAutoObservable } from 'mobx';
import type { RouterOutputs } from '@/lib/trpc/client';

type Position = RouterOutputs['portfolio']['getPositionById'];
type Balance = RouterOutputs['portfolio']['getUserBalance'];
type PortfolioSummary = RouterOutputs['portfolio']['getPortfolioSummary'];
type PortfolioPerformance = RouterOutputs['portfolio']['getPortfolioPerformance'];
type PortfolioRisk = RouterOutputs['portfolio']['getPortfolioRisk'];

export class PortfolioStore {
    // Base store functionality
    isLoading = false;
    isSubmitting = false;
    error: string | null = null;

    // Current position data
    currentPosition: Position | null = null;

    // Positions list
    positions: Position[] = [];
    positionsTotal = 0;
    positionsPage = 1;
    positionsLimit = 10;

    // Balance data
    balance: Balance | null = null;

    // Portfolio analytics
    portfolioSummary: PortfolioSummary | null = null;
    portfolioPerformance: PortfolioPerformance | null = null;
    portfolioRisk: PortfolioRisk | null = null;

    // Search and filters
    searchQuery = '';
    filters = {
        symbol: undefined as string | undefined,
        exchange: undefined as string | undefined,
        productType: undefined as string | undefined,
        minQuantity: undefined as number | undefined,
        maxQuantity: undefined as number | undefined,
    };

    constructor() {
        makeAutoObservable(this);
    }

    // Base store methods
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

    // Data setters (to be called from React components using tRPC hooks)
    setCurrentPosition(position: Position | null) {
        this.currentPosition = position;
    }

    setPositions(positions: Position[], total: number) {
        this.positions = positions;
        this.positionsTotal = total;
    }

    setBalance(balance: Balance | null) {
        this.balance = balance;
    }

    setPortfolioSummary(summary: PortfolioSummary | null) {
        this.portfolioSummary = summary;
    }

    setPortfolioPerformance(performance: PortfolioPerformance | null) {
        this.portfolioPerformance = performance;
    }

    setPortfolioRisk(risk: PortfolioRisk | null) {
        this.portfolioRisk = risk;
    }

    // Position management actions
    addPosition(position: Position) {
        this.positions.unshift(position);
        this.positionsTotal += 1;
    }

    updatePositionInList(updatedPosition: Position) {
        const index = this.positions.findIndex(position => position.id === updatedPosition.id);
        if (index !== -1) {
            this.positions[index] = updatedPosition;
        }

        // Update current position if it's the same one
        if (this.currentPosition?.id === updatedPosition.id) {
            this.currentPosition = updatedPosition;
        }
    }

    removePosition(positionId: string) {
        this.positions = this.positions.filter(position => position.id !== positionId);
        this.positionsTotal = Math.max(0, this.positionsTotal - 1);

        // Clear current position if it was deleted
        if (this.currentPosition?.id === positionId) {
            this.currentPosition = null;
        }
    }

    removePositions(positionIds: string[]) {
        this.positions = this.positions.filter(position => !positionIds.includes(position.id));
        this.positionsTotal = Math.max(0, this.positionsTotal - positionIds.length);

        // Clear current position if it was deleted
        if (this.currentPosition && positionIds.includes(this.currentPosition.id)) {
            this.currentPosition = null;
        }
    }

    // Bulk position updates (for real-time price updates)
    updatePositionsPnL(updates: Array<{ id: string; lastTradedPrice: number; dayChange: number; dayChangePct: number }>) {
        updates.forEach(update => {
            const position = this.positions.find(p => p.id === update.id);
            if (position) {
                position.lastTradedPrice = update.lastTradedPrice;
                position.dayChange = update.dayChange;
                position.dayChangePct = update.dayChangePct;

                // Recalculate P&L
                position.marketValue = position.quantity * update.lastTradedPrice;
                position.pnl = position.marketValue - (position.quantity * position.averagePrice);
            }
        });

        // Update current position if it's in the updates
        if (this.currentPosition) {
            const currentUpdate = updates.find(u => u.id === this.currentPosition!.id);
            if (currentUpdate) {
                this.currentPosition.lastTradedPrice = currentUpdate.lastTradedPrice;
                this.currentPosition.dayChange = currentUpdate.dayChange;
                this.currentPosition.dayChangePct = currentUpdate.dayChangePct;
                this.currentPosition.marketValue = this.currentPosition.quantity * currentUpdate.lastTradedPrice;
                this.currentPosition.pnl = this.currentPosition.marketValue - (this.currentPosition.quantity * this.currentPosition.averagePrice);
            }
        }
    }

    // Filters and pagination
    setFilters(filters: Partial<typeof this.filters>) {
        this.filters = { ...this.filters, ...filters };
        this.positionsPage = 1; // Reset to first page
    }

    clearFilters() {
        this.filters = {
            symbol: undefined,
            exchange: undefined,
            productType: undefined,
            minQuantity: undefined,
            maxQuantity: undefined,
        };
        this.searchQuery = '';
        this.positionsPage = 1;
    }

    setSearchQuery(query: string) {
        this.searchQuery = query;
        this.positionsPage = 1; // Reset to first page
    }

    setPage(page: number) {
        this.positionsPage = page;
    }

    setLimit(limit: number) {
        this.positionsLimit = limit;
        this.positionsPage = 1; // Reset to first page
    }

    nextPage() {
        if (this.hasNextPage) {
            this.positionsPage += 1;
        }
    }

    previousPage() {
        if (this.hasPreviousPage) {
            this.positionsPage -= 1;
        }
    }

    // Computed properties
    get hasNextPage() {
        return this.positionsPage * this.positionsLimit < this.positionsTotal;
    }

    get hasPreviousPage() {
        return this.positionsPage > 1;
    }

    get totalPages() {
        return Math.ceil(this.positionsTotal / this.positionsLimit);
    }

    get currentFilters() {
        return {
            ...this.filters,
            page: this.positionsPage,
            limit: this.positionsLimit,
        };
    }

    get hasActiveFilters() {
        return Object.values(this.filters).some(value => value !== undefined) || this.searchQuery.trim() !== '';
    }

    // Position category getters
    get profitablePositions() {
        return this.positions.filter(position => position.pnl > 0);
    }

    get losingPositions() {
        return this.positions.filter(position => position.pnl < 0);
    }

    get breakEvenPositions() {
        return this.positions.filter(position => position.pnl === 0);
    }

    get longPositions() {
        return this.positions.filter(position => position.quantity > 0);
    }

    get shortPositions() {
        return this.positions.filter(position => position.quantity < 0);
    }

    // Position aggregations
    get positionsBySymbol() {
        const symbolMap = new Map<string, Position[]>();
        this.positions.forEach(position => {
            const symbol = position.symbol;
            if (!symbolMap.has(symbol)) {
                symbolMap.set(symbol, []);
            }
            symbolMap.get(symbol)!.push(position);
        });
        return symbolMap;
    }

    get positionsByExchange() {
        const exchangeMap = new Map<string, Position[]>();
        this.positions.forEach(position => {
            const exchange = position.exchange;
            if (!exchangeMap.has(exchange)) {
                exchangeMap.set(exchange, []);
            }
            exchangeMap.get(exchange)!.push(position);
        });
        return exchangeMap;
    }

    get positionsByProductType() {
        const productTypeMap = new Map<string, Position[]>();
        this.positions.forEach(position => {
            const productType = position.productType;
            if (!productTypeMap.has(productType)) {
                productTypeMap.set(productType, []);
            }
            productTypeMap.get(productType)!.push(position);
        });
        return productTypeMap;
    }

    // Portfolio value calculations
    get totalPortfolioValue() {
        return this.positions.reduce((total, position) => total + position.marketValue, 0);
    }

    get totalPnL() {
        return this.positions.reduce((total, position) => total + position.pnl, 0);
    }

    get totalRealizedPnL() {
        return this.positions.reduce((total, position) => total + (position.realizedPnl || 0), 0);
    }

    get totalDayChange() {
        return this.positions.reduce((total, position) => total + (position.dayChange || 0), 0);
    }

    get totalDayChangePct() {
        const totalInvestment = this.totalInvested;
        return totalInvestment > 0 ? (this.totalDayChange / totalInvestment) * 100 : 0;
    }

    // Investment calculations
    get totalInvested() {
        return this.positions.reduce((total, position) => {
            return total + (Math.abs(position.quantity) * position.averagePrice);
        }, 0);
    }

    get portfolioReturnPct() {
        const totalInvestment = this.totalInvested;
        return totalInvestment > 0 ? (this.totalPnL / totalInvestment) * 100 : 0;
    }

    // Risk and concentration metrics
    get portfolioConcentration() {
        const totalValue = this.totalPortfolioValue;
        if (totalValue === 0) return new Map<string, number>();

        const concentrationMap = new Map<string, number>();
        this.positions.forEach(position => {
            const weight = (Math.abs(position.marketValue) / totalValue) * 100;
            concentrationMap.set(position.symbol, weight);
        });
        return concentrationMap;
    }

    get topHoldings() {
        return this.positions
            .sort((a, b) => Math.abs(b.marketValue) - Math.abs(a.marketValue))
            .slice(0, 10);
    }

    get isOverConcentrated() {
        const concentration = this.portfolioConcentration;
        return Array.from(concentration.values()).some(weight => weight > 25); // 25% threshold
    }

    // Balance and buying power
    get availableCash() {
        return this.balance?.availableCash || 0;
    }

    get totalBalance() {
        return this.balance?.totalBalance || 0;
    }

    get buyingPower() {
        return this.balance?.buyingPower || 0;
    }

    get marginUsed() {
        return this.balance?.marginUsed || 0;
    }

    get marginAvailable() {
        return this.balance?.marginAvailable || 0;
    }

    // Clear data
    clear() {
        this.currentPosition = null;
        this.positions = [];
        this.positionsTotal = 0;
        this.balance = null;
        this.portfolioSummary = null;
        this.portfolioPerformance = null;
        this.portfolioRisk = null;
        this.clearFilters();
        this.clearError();
    }
} 