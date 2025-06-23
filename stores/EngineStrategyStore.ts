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
import type { Strategy, StoreState } from "@/types";

// Define local types that match what the UI expects
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

interface StrategyStats {
  total: number;
  active: number;
  paused: number;
  stopped: number;
  draft: number;
  totalPnl: number;
  totalTrades: number;
}

interface StrategyFilters {
  status?: string;
  assetClass?: string;
  strategyType?: string;
  userId?: string;
}

export class EngineStrategyStore implements StoreState {
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  lastError: AppError | null = null;

  // Current strategy data
  currentStrategy: Strategy | null = null;
  currentStrategyPerformance: StrategyPerformance | null = null;

  // Strategies list - from marketplace and user strategies
  strategies: StrategyWithCounts[] = [];
  userStrategies: StrategyWithCounts[] = [];
  marketplaceStrategies: Strategy[] = [];
  strategiesTotal = 0;
  strategiesPage = 1;
  strategiesLimit = 10;

  // Global strategy stats
  strategyStats: StrategyStats | null = null;

  // Search and filters
  searchQuery = "";
  filters: Partial<StrategyFilters> = {
    status: undefined,
    assetClass: undefined,
    strategyType: undefined,
    userId: undefined,
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

  async fetchMarketplace() {
    this.setLoading(true);
    this.clearError();

    const context: ErrorContext = {
      action: "fetchMarketplace",
      component: "EngineStrategyStore",
    };

    try {
      const result = await withRetry(() => tradingEngineApi.getMarketplace(), {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          console.log(
            `Retrying fetchMarketplace (attempt ${attempt}):`,
            error.message
          );
        },
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch marketplace");
      }

      runInAction(() => {
        this.marketplaceStrategies = result.data!.map((engineStrategy) =>
          EngineDataAdapter.engineStrategyToFrontend(engineStrategy)
        );
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

  async fetchUserDashboard() {
    this.setLoading(true);
    this.clearError();

    const context: ErrorContext = {
      action: "fetchUserDashboard",
      component: "EngineStrategyStore",
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
        // Convert user strategies to frontend format
        const userStrategies = result.data!.active_strategies.map(
          (userStrategy) => {
            // Try to find corresponding marketplace strategy
            const marketplaceStrategy = this.marketplaceStrategies.find(
              (s) => s.id === userStrategy.strategy_id
            );
            return EngineDataAdapter.userStrategyToFrontend(
              userStrategy,
              marketplaceStrategy
                ? {
                    strategy_id: marketplaceStrategy.id,
                    name: marketplaceStrategy.name,
                    description: marketplaceStrategy.description || "",
                    category: marketplaceStrategy.strategyType,
                    risk_level: "medium",
                    min_capital: marketplaceStrategy.capitalAllocated,
                    expected_return_annual: 0,
                    max_drawdown: marketplaceStrategy.maxDrawdown,
                    symbols: marketplaceStrategy.symbols,
                    parameters: marketplaceStrategy.parameters,
                    is_active: true,
                  }
                : undefined
            );
          }
        );

        this.userStrategies = userStrategies;
        this.strategies = userStrategies;
        this.strategiesTotal = userStrategies.length;
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

  async activateStrategy(strategyId: string, allocationAmount: number = 0) {
    this.setSubmitting(true);
    this.clearError();

    const context: ErrorContext = {
      action: "activateStrategy",
      component: "EngineStrategyStore",
      strategyId,
    };

    try {
      const result = await tradingEngineApi.activateStrategy(
        strategyId,
        allocationAmount
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to activate strategy");
      }

      runInAction(() => {
        console.log("Strategy activated successfully:", result.data);
        // Refresh user dashboard to get updated data
        this.fetchUserDashboard();
      });

      return result.data;
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

  async deactivateStrategy(strategyId: string) {
    this.setSubmitting(true);
    this.clearError();

    const context: ErrorContext = {
      action: "deactivateStrategy",
      component: "EngineStrategyStore",
      strategyId,
    };

    try {
      const result = await tradingEngineApi.deactivateStrategy(strategyId);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to deactivate strategy");
      }

      runInAction(() => {
        console.log("Strategy deactivated successfully:", result.data);
        // Remove from user strategies
        this.userStrategies = this.userStrategies.filter(
          (s) => s.id !== strategyId
        );
        this.strategies = this.userStrategies;
        this.strategiesTotal = this.userStrategies.length;
      });

      return result.data;
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

  // Compatibility methods for existing UI components
  async startStrategy(id: string) {
    return this.activateStrategy(id);
  }

  async stopStrategy(id: string) {
    return this.deactivateStrategy(id);
  }

  async pauseStrategy(id: string) {
    // Engine doesn't have pause, so we deactivate for now
    return this.deactivateStrategy(id);
  }

  async fetchStrategies(userId: string) {
    // For compatibility with existing UI
    await this.fetchUserDashboard();
  }

  async updateStrategy(id: string, data: Partial<Strategy>) {
    this.setSubmitting(true);
    this.clearError();

    try {
      // Engine doesn't support strategy updates, so we just log for now
      console.log("Strategy update requested (not supported by engine):", {
        id,
        data,
      });

      runInAction(() => {
        console.log("Strategy update simulated successfully");
      });

      return { id, ...data };
    } catch (error: unknown) {
      const appError = classifyError(error, {
        action: "updateStrategy",
        component: "EngineStrategyStore",
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

  async bulkStopStrategies(strategyIds: string[]) {
    this.setSubmitting(true);
    this.clearError();

    try {
      const promises = strategyIds.map((id) => this.deactivateStrategy(id));
      await Promise.all(promises);
    } finally {
      runInAction(() => {
        this.setSubmitting(false);
      });
    }
  }

  // Setters and utility methods
  setCurrentStrategy(strategy: Strategy | null) {
    this.currentStrategy = strategy;
  }

  setCurrentStrategyPerformance(performance: StrategyPerformance | null) {
    this.currentStrategyPerformance = performance;
  }

  setStrategies(strategies: StrategyWithCounts[], total?: number) {
    this.strategies = strategies;
    if (total !== undefined) {
      this.strategiesTotal = total;
    }
  }

  setStrategyStats(stats: StrategyStats | null) {
    this.strategyStats = stats;
  }

  addStrategy(strategy: StrategyWithCounts) {
    this.strategies.push(strategy);
    this.strategiesTotal += 1;
  }

  updateStrategyInList(updatedStrategy: StrategyWithCounts) {
    const index = this.strategies.findIndex((s) => s.id === updatedStrategy.id);
    if (index !== -1) {
      this.strategies[index] = updatedStrategy;
    }
  }

  removeStrategy(strategyId: string) {
    this.strategies = this.strategies.filter((s) => s.id !== strategyId);
    this.strategiesTotal = Math.max(0, this.strategiesTotal - 1);
  }

  removeStrategies(strategyIds: string[]) {
    this.strategies = this.strategies.filter(
      (s) => !strategyIds.includes(s.id)
    );
    this.strategiesTotal = Math.max(
      0,
      this.strategiesTotal - strategyIds.length
    );
  }

  setFilters(filters: Partial<typeof this.filters>) {
    this.filters = { ...this.filters, ...filters };
    this.strategiesPage = 1; // Reset to first page when filters change
  }

  clearFilters() {
    this.filters = {
      status: undefined,
      assetClass: undefined,
      strategyType: undefined,
      userId: undefined,
    };
    this.strategiesPage = 1;
  }

  setSearchQuery(query: string) {
    this.searchQuery = query;
    this.strategiesPage = 1; // Reset to first page when search changes
  }

  setPage(page: number) {
    this.strategiesPage = page;
  }

  setLimit(limit: number) {
    this.strategiesLimit = limit;
    this.strategiesPage = 1; // Reset to first page when limit changes
  }

  nextPage() {
    if (this.hasNextPage) {
      this.strategiesPage += 1;
    }
  }

  previousPage() {
    if (this.hasPreviousPage) {
      this.strategiesPage -= 1;
    }
  }

  get hasNextPage() {
    return this.strategiesPage < this.totalPages;
  }

  get hasPreviousPage() {
    return this.strategiesPage > 1;
  }

  get totalPages() {
    return Math.ceil(this.strategiesTotal / this.strategiesLimit);
  }

  get activeStrategies() {
    return this.strategies.filter((s) => s.status === "ACTIVE");
  }

  get pausedStrategies() {
    return this.strategies.filter((s) => s.status === "PAUSED");
  }

  get stoppedStrategies() {
    return this.strategies.filter((s) => s.status === "STOPPED");
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
    this.strategies = [];
    this.userStrategies = [];
    this.marketplaceStrategies = [];
    this.currentStrategy = null;
    this.currentStrategyPerformance = null;
    this.strategyStats = null;
    this.strategiesTotal = 0;
    this.strategiesPage = 1;
    this.searchQuery = "";
    this.clearFilters();
    this.clearError();
  }
}

export default EngineStrategyStore;
