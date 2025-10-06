import { makeAutoObservable, runInAction } from "mobx";
import { tradingEngineApi } from "@/services/engine-api.service";
import { EngineDataAdapter } from "@/services/adapters/engine-data-adapter";

// Local interface to avoid conflicts with tRPC types
export interface StrategyWithCounts {
  id: string;
  userId: string;
  name: string;
  description?: string;
  strategyType: string;
  assetClass: string;
  symbols: string[];
  timeframe: string;
  status: string;
  parameters: any;
  riskParameters: any;
  totalPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  maxPositions: number;
  capitalAllocated: number;
  startTime?: string;
  endTime?: string;
  activeDays: string[];
  version: number;
  createdAt: Date;
  updatedAt?: Date;
  lastExecutedAt?: Date;
  _count: {
    orders: number;
    strategyLogs: number;
  };
}

export interface StrategySummaryStats {
  total_strategies: number;
  active_strategies: number;
  paused_strategies: number;
  stopped_strategies: number;
  total_pnl: number;
  total_trades: number;
  win_rate: number;
}

export interface StrategyPaginationState {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface StrategyFilterState {
  searchQuery: string;
  statusFilter: string;
  assetClassFilter: string;
  strategyTypeFilter: string;
}

export const STRATEGY_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "STOPPED", label: "Stopped" },
  { value: "DRAFT", label: "Draft" },
  { value: "ERROR", label: "Error" },
];

export const ASSET_CLASS_OPTIONS = [
  { value: "all", label: "All Assets" },
  { value: "EQUITY", label: "Equity" },
  { value: "DERIVATIVES", label: "Derivatives" },
  { value: "CRYPTO", label: "Crypto" },
  { value: "COMMODITIES", label: "Commodities" },
  { value: "FOREX", label: "Forex" },
];

export const STRATEGY_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "RSI_DMI", label: "RSI DMI" },
  { value: "SWING", label: "Swing" },
  { value: "MOMENTUM", label: "Momentum" },
  { value: "INTRADAY", label: "Intraday" },
];

export class StrategyPageModel {
  // State
  strategies: StrategyWithCounts[] = [];
  marketplaceStrategies: any[] = [];
  summaryStats: StrategySummaryStats = {
    total_strategies: 0,
    active_strategies: 0,
    paused_strategies: 0,
    stopped_strategies: 0,
    total_pnl: 0,
    total_trades: 0,
    win_rate: 0,
  };

  pagination: StrategyPaginationState = {
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    totalItems: 0,
  };

  filters: StrategyFilterState = {
    searchQuery: "",
    statusFilter: "all",
    assetClassFilter: "all",
    strategyTypeFilter: "all",
  };

  // Loading states
  isLoadingStrategies = false;
  isLoadingSummary = false;
  isRefreshing = false;
  isManualRefresh = false;

  // Error states
  strategiesError: string | null = null;
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
    // Search is handled client-side for better UX
  }

  setStatusFilter(status: string) {
    this.filters.statusFilter = status;
    this.pagination.currentPage = 1;
    this.fetchStrategies();
    this.fetchSummary();
  }

  setAssetClassFilter(assetClass: string) {
    this.filters.assetClassFilter = assetClass;
    this.pagination.currentPage = 1;
    this.fetchStrategies();
    this.fetchSummary();
  }

  setStrategyTypeFilter(strategyType: string) {
    this.filters.strategyTypeFilter = strategyType;
    this.pagination.currentPage = 1;
    this.fetchStrategies();
    this.fetchSummary();
  }

  setPageSize(pageSize: number) {
    this.pagination.pageSize = pageSize;
    this.pagination.currentPage = 1;
    this.fetchStrategies();
  }

  setCurrentPage(page: number) {
    this.pagination.currentPage = page;
    this.fetchStrategies();
  }

  setRefreshing(refreshing: boolean) {
    this.isRefreshing = refreshing;
  }

  setManualRefresh(refreshing: boolean) {
    this.isManualRefresh = refreshing;
  }

  // Computed
  get filteredStrategies(): StrategyWithCounts[] {
    let filtered = this.strategies;

    if (this.filters.searchQuery) {
      const query = this.filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (strategy) =>
          strategy.name.toLowerCase().includes(query) ||
          strategy.strategyType.toLowerCase().includes(query) ||
          strategy.assetClass.toLowerCase().includes(query)
      );
    }

    if (this.filters.statusFilter !== "all") {
      filtered = filtered.filter(
        (strategy) => strategy.status === this.filters.statusFilter
      );
    }

    if (this.filters.assetClassFilter !== "all") {
      filtered = filtered.filter(
        (strategy) => strategy.assetClass === this.filters.assetClassFilter
      );
    }

    if (this.filters.strategyTypeFilter !== "all") {
      filtered = filtered.filter(
        (strategy) => strategy.strategyType === this.filters.strategyTypeFilter
      );
    }

    return filtered;
  }

  // API calls
  async fetchMarketplace() {
    try {
      const result = await tradingEngineApi.getMarketplace();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch marketplace");
      }

      runInAction(() => {
        this.marketplaceStrategies = result.data!;
      });
    } catch (error) {
      console.error("Failed to fetch marketplace:", error);
    }
  }

  async fetchStrategies() {
    if (!this.userId) return;

    this.isLoadingStrategies = true;
    this.strategiesError = null;

    try {
      // First fetch marketplace to get strategy details
      await this.fetchMarketplace();

      const result = await tradingEngineApi.getUserDashboard();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch strategies");
      }

      // Convert user strategies to frontend format
      const userStrategies = result.data!.active_strategies.map(
        (userStrategy: any) => {
          // Try to find corresponding marketplace strategy
          const marketplaceStrategy = this.marketplaceStrategies.find(
            (s: any) => s.strategy_id === userStrategy.strategy_id
          );

          const convertedStrategy = EngineDataAdapter.userStrategyToFrontend(
            userStrategy,
            marketplaceStrategy
              ? {
                  strategy_id: marketplaceStrategy.strategy_id,
                  name: marketplaceStrategy.name,
                  description: marketplaceStrategy.description || "",
                  category: marketplaceStrategy.category,
                  risk_level: "medium",
                  min_capital: marketplaceStrategy.min_capital,
                  expected_return_annual: 0,
                  max_drawdown: marketplaceStrategy.max_drawdown,
                  symbols: marketplaceStrategy.symbols,
                  parameters: marketplaceStrategy.parameters,
                  is_active: true,
                }
              : undefined
          );

          return convertedStrategy;
        }
      );

      runInAction(() => {
        this.strategies = userStrategies;
        this.pagination.totalItems = userStrategies.length;
        this.pagination.totalPages = Math.ceil(
          userStrategies.length / this.pagination.pageSize
        );
        this.isLoadingStrategies = false;
      });
    } catch (error) {
      runInAction(() => {
        this.strategiesError =
          error instanceof Error ? error.message : "Failed to fetch strategies";
        this.isLoadingStrategies = false;
      });
    }
  }

  async fetchSummary() {
    if (!this.userId) return;

    this.isLoadingSummary = true;
    this.summaryError = null;

    try {
      // Calculate summary from current strategies (not filtered ones)
      const totalStrategies = this.strategies.length;
      const activeStrategies = this.strategies.filter(
        (s) => s.status === "ACTIVE"
      ).length;
      const pausedStrategies = this.strategies.filter(
        (s) => s.status === "PAUSED"
      ).length;
      const stoppedStrategies = this.strategies.filter(
        (s) => s.status === "STOPPED"
      ).length;

      const totalPnl = this.strategies.reduce(
        (sum, s) => sum + (s.totalPnl || 0),
        0
      );
      const totalTrades = this.strategies.reduce(
        (sum, s) => sum + (s.totalTrades || 0),
        0
      );
      const winRate =
        totalStrategies > 0
          ? this.strategies.reduce((sum, s) => sum + (s.winRate || 0), 0) /
            totalStrategies
          : 0;

      runInAction(() => {
        this.summaryStats = {
          total_strategies: totalStrategies,
          active_strategies: activeStrategies,
          paused_strategies: pausedStrategies,
          stopped_strategies: stoppedStrategies,
          total_pnl: totalPnl,
          total_trades: totalTrades,
          win_rate: winRate,
        };
        this.isLoadingSummary = false;
      });
    } catch (error) {
      runInAction(() => {
        this.summaryError =
          error instanceof Error ? error.message : "Failed to fetch summary";
        this.isLoadingSummary = false;
      });
    }
  }

  async refresh() {
    this.setRefreshing(true);
    this.setManualRefresh(true);

    try {
      // First fetch strategies, then calculate summary
      await this.fetchStrategies();
      await this.fetchSummary();
    } finally {
      this.setRefreshing(false);
      this.setManualRefresh(false);
    }
  }

  async initialize(userId: string) {
    this.setUserId(userId);
    await this.refresh();
  }

  // Strategy actions
  async activateStrategy(strategyId: string, allocationAmount: number = 0) {
    try {
      const result = await tradingEngineApi.activateStrategy(
        strategyId,
        allocationAmount
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to activate strategy");
      }

      // Update local state immediately
      runInAction(() => {
        const strategy = this.strategies.find((s) => s.id === strategyId);
        if (strategy) {
          strategy.status = "ACTIVE";
        }

        // Recalculate summary stats
        this.updateSummaryStats();
      });

      return result.data;
    } catch (error) {
      throw error;
    }
  }

  async deactivateStrategy(strategyId: string) {
    try {
      const result = await tradingEngineApi.deactivateStrategy(strategyId);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to deactivate strategy");
      }

      // Update local state immediately
      runInAction(() => {
        const strategy = this.strategies.find((s) => s.id === strategyId);
        if (strategy) {
          strategy.status = "STOPPED";
        }

        // Recalculate summary stats
        this.updateSummaryStats();
      });

      return result.data;
    } catch (error) {
      throw error;
    }
  }

  async startStrategy(strategyId: string) {
    // Check if the strategy is currently paused
    const strategy = this.strategies.find((s) => s.id === strategyId);
    if (strategy && strategy.status === "PAUSED") {
      return this.resumeStrategy(strategyId);
    }
    return this.activateStrategy(strategyId);
  }

  async stopStrategy(strategyId: string) {
    return this.deactivateStrategy(strategyId);
  }

  async pauseStrategy(strategyId: string) {
    try {
      const result = await tradingEngineApi.pauseStrategy(strategyId);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to pause strategy");
      }

      // Update local state immediately
      runInAction(() => {
        const strategy = this.strategies.find((s) => s.id === strategyId);
        if (strategy) {
          strategy.status = "PAUSED";
        }

        // Recalculate summary stats
        this.updateSummaryStats();
      });

      return result.data;
    } catch (error) {
      console.error("Error pausing strategy:", error);
      throw error;
    }
  }

  async resumeStrategy(strategyId: string) {
    try {
      const result = await tradingEngineApi.resumeStrategy(strategyId);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to resume strategy");
      }

      // Update local state immediately
      runInAction(() => {
        const strategy = this.strategies.find((s) => s.id === strategyId);
        if (strategy) {
          strategy.status = "ACTIVE";
        }

        // Recalculate summary stats
        this.updateSummaryStats();
      });

      return result.data;
    } catch (error) {
      console.error("Error resuming strategy:", error);
      throw error;
    }
  }

  async updateStrategy(strategyId: string, data: Partial<StrategyWithCounts>) {
    try {
      // Convert frontend strategy data to API format
      const updateData = {
        name: data.name,
        description: data.description,
        enabled: data.status === "ACTIVE",
        parameters: data.parameters,
        risk_parameters: data.riskParameters,
        max_drawdown: data.maxDrawdown,
        max_positions: data.maxPositions,
        capital_allocated: data.capitalAllocated,
      };

      const result = await tradingEngineApi.updateStrategy(
        strategyId,
        updateData
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to update strategy");
      }

      // Update local state immediately
      runInAction(() => {
        const strategyIndex = this.strategies.findIndex(
          (s) => s.id === strategyId
        );
        if (strategyIndex !== -1) {
          this.strategies[strategyIndex] = {
            ...this.strategies[strategyIndex],
            ...data,
            updatedAt: new Date(),
          };
        }

        // Recalculate summary stats
        this.updateSummaryStats();
      });

      return result.data;
    } catch (error) {
      console.error("Error updating strategy:", error);
      throw error;
    }
  }

  async deleteStrategy(strategyId: string) {
    try {
      const result = await tradingEngineApi.deleteStrategy(strategyId);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete strategy");
      }

      // Update local state immediately
      runInAction(() => {
        this.strategies = this.strategies.filter((s) => s.id !== strategyId);
        this.pagination.totalItems = this.strategies.length;
        this.pagination.totalPages = Math.ceil(
          this.strategies.length / this.pagination.pageSize
        );

        // Recalculate summary stats
        this.updateSummaryStats();
      });

      return result.data;
    } catch (error) {
      console.error("Error deleting strategy:", error);
      throw error;
    }
  }

  // Helper method to update summary stats without refetching
  private updateSummaryStats() {
    const totalStrategies = this.strategies.length;
    const activeStrategies = this.strategies.filter(
      (s) => s.status === "ACTIVE"
    ).length;
    const pausedStrategies = this.strategies.filter(
      (s) => s.status === "PAUSED"
    ).length;
    const stoppedStrategies = this.strategies.filter(
      (s) => s.status === "STOPPED"
    ).length;

    const totalPnl = this.strategies.reduce(
      (sum, s) => sum + (s.totalPnl || 0),
      0
    );
    const totalTrades = this.strategies.reduce(
      (sum, s) => sum + (s.totalTrades || 0),
      0
    );
    const winRate =
      totalStrategies > 0
        ? this.strategies.reduce((sum, s) => sum + (s.winRate || 0), 0) /
          totalStrategies
        : 0;

    this.summaryStats = {
      total_strategies: totalStrategies,
      active_strategies: activeStrategies,
      paused_strategies: pausedStrategies,
      stopped_strategies: stoppedStrategies,
      total_pnl: totalPnl,
      total_trades: totalTrades,
      win_rate: winRate,
    };
  }
}

export const strategyPageModel = new StrategyPageModel();
