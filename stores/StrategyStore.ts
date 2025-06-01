import { makeAutoObservable, runInAction } from "mobx";
import { vanillaTrpc } from "@/lib/trpc/client";
import {
  classifyError,
  reportError,
  withRetry,
  type AppError,
  type ErrorContext,
} from "@/stores/utils/errorHandler";
import type {
  Strategy,
  StrategyWithCounts,
  StrategyPerformance,
  StrategyStats,
  StrategyFilters,
  StoreState,
} from "@/types";

export class StrategyStore implements StoreState {
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  lastError: AppError | null = null;

  // Current strategy data
  currentStrategy: Strategy | null = null;
  currentStrategyPerformance: StrategyPerformance | null = null;

  // Strategies list - using the proper type from centralized types
  strategies: StrategyWithCounts[] = [];
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

  // --- Actions using tRPC with proper error handling ---

  async fetchStrategies(userId: string) {
    this.setLoading(true);
    this.clearError();

    const context: ErrorContext = {
      userId,
      action: "fetchStrategies",
      component: "StrategyStore",
    };

    try {
      const result = await withRetry(
        () =>
          vanillaTrpc.strategy.getByUserId.query({
            userId,
            pagination: {
              page: this.strategiesPage,
              limit: this.strategiesLimit,
            },
            filters: this.filters,
          }),
        {
          maxAttempts: 3,
          onRetry: (attempt, error) => {
            console.log(
              `Retrying fetchStrategies (attempt ${attempt}):`,
              error.message
            );
          },
        }
      );

      runInAction(() => {
        this.strategies = result.data;
        this.strategiesTotal = result.total;
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

  async startStrategy(id: string) {
    this.setSubmitting(true);
    this.clearError();

    const context: ErrorContext = {
      action: "startStrategy",
      component: "StrategyStore",
      strategyId: id,
    };

    try {
      const result = await vanillaTrpc.strategy.start.mutate({ id });
      runInAction(() => {
        console.log("Strategy started successfully:", result);
      });
      return result;
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

  async updateStrategy(id: string, data: Partial<Strategy>) {
    this.setSubmitting(true);
    this.clearError();

    const context: ErrorContext = {
      action: "updateStrategy",
      component: "StrategyStore",
      strategyId: id,
      updateFields: Object.keys(data),
    };

    try {
      const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, unknown>);

      const updatedStrategy = await vanillaTrpc.strategy.update.mutate({
        id,
        ...filteredData,
      });

      runInAction(() => {
        console.log("Strategy updated successfully:", updatedStrategy);
      });
      return updatedStrategy;
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

  async stopStrategy(id: string) {
    this.setSubmitting(true);
    this.clearError();

    const context: ErrorContext = {
      action: "stopStrategy",
      component: "StrategyStore",
      strategyId: id,
    };

    try {
      const result = await vanillaTrpc.strategy.stop.mutate({ id });
      runInAction(() => {
        console.log("Strategy stopped successfully:", result);
      });
      return result;
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

  async pauseStrategy(id: string) {
    this.setSubmitting(true);
    this.clearError();

    const context: ErrorContext = {
      action: "pauseStrategy",
      component: "StrategyStore",
      strategyId: id,
    };

    try {
      const result = await vanillaTrpc.strategy.pause.mutate({ id });
      runInAction(() => {
        console.log("Strategy paused successfully:", result);
      });
      return result;
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

  async bulkStopStrategies(strategyIds: string[]) {
    this.setSubmitting(true);
    this.clearError();

    const context: ErrorContext = {
      action: "bulkStopStrategies",
      component: "StrategyStore",
      strategyCount: strategyIds.length,
    };

    try {
      const result = await vanillaTrpc.strategy.bulkUpdate.mutate({
        strategyIds,
        updateData: { isActive: false },
      });
      runInAction(() => {
        console.log("All strategies stopped successfully:", result);
      });
      return result;
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

  // --- Data setters (to be called from React components using tRPC hooks) ---
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

  // --- Strategy management actions ---
  addStrategy(strategy: StrategyWithCounts) {
    this.strategies.unshift(strategy);
    this.strategiesTotal += 1;
  }

  updateStrategyInList(updatedStrategy: StrategyWithCounts) {
    const index = this.strategies.findIndex(
      (strategy) => strategy.id === updatedStrategy.id
    );
    if (index !== -1) {
      this.strategies[index] = updatedStrategy;
    }

    // Update current strategy if it's the same one - only if types are compatible
    if (this.currentStrategy?.id === updatedStrategy.id) {
      // Convert StrategyItem to Strategy format if needed
      this.currentStrategy = {
        ...this.currentStrategy,
        ...updatedStrategy,
      };
    }
  }

  removeStrategy(strategyId: string) {
    this.strategies = this.strategies.filter(
      (strategy) => strategy.id !== strategyId
    );
    this.strategiesTotal = Math.max(0, this.strategiesTotal - 1);

    // Clear current strategy if it was deleted
    if (this.currentStrategy?.id === strategyId) {
      this.currentStrategy = null;
      this.currentStrategyPerformance = null;
    }
  }

  removeStrategies(strategyIds: string[]) {
    this.strategies = this.strategies.filter(
      (strategy) => !strategyIds.includes(strategy.id)
    );
    this.strategiesTotal = Math.max(
      0,
      this.strategiesTotal - strategyIds.length
    );

    // Clear current strategy if it was deleted
    if (this.currentStrategy && strategyIds.includes(this.currentStrategy.id)) {
      this.currentStrategy = null;
      this.currentStrategyPerformance = null;
    }
  }

  // --- Filters and pagination ---
  setFilters(filters: Partial<typeof this.filters>) {
    this.filters = { ...this.filters, ...filters };
    this.strategiesPage = 1; // Reset to first page
    // Note: You'll need to pass userId when calling fetchStrategies
    // this.fetchStrategies(userId); // Fetch data with new filters
  }

  clearFilters() {
    this.filters = {
      status: undefined,
      assetClass: undefined,
      strategyType: undefined,
      userId: undefined,
    };
    this.searchQuery = "";
    this.strategiesPage = 1;
    // Note: You'll need to pass userId when calling fetchStrategies
    // this.fetchStrategies(userId); // Fetch data after clearing filters
  }

  setSearchQuery(query: string) {
    this.searchQuery = query;
    this.strategiesPage = 1; // Reset to first page
    // Note: You'll need to pass userId when calling fetchStrategies
    // this.fetchStrategies(userId); // Fetch data with new search query
  }

  setPage(page: number) {
    this.strategiesPage = page;
    // Note: You'll need to pass userId when calling fetchStrategies
    // this.fetchStrategies(userId); // Fetch data for new page
  }

  setLimit(limit: number) {
    this.strategiesLimit = limit;
    this.strategiesPage = 1; // Reset to first page
    // Note: You'll need to pass userId when calling fetchStrategies
    // this.fetchStrategies(userId); // Fetch data with new limit
  }

  nextPage() {
    if (this.hasNextPage) {
      this.strategiesPage += 1;
      // Note: You'll need to pass userId when calling fetchStrategies
      // this.fetchStrategies(userId); // Fetch data for next page
    }
  }

  previousPage() {
    if (this.hasPreviousPage) {
      this.strategiesPage -= 1;
      // Note: You'll need to pass userId when calling fetchStrategies
      // this.fetchStrategies(userId); // Fetch data for previous page
    }
  }

  // --- Computed properties ---
  get hasNextPage() {
    return this.strategiesPage * this.strategiesLimit < this.strategiesTotal;
  }

  get hasPreviousPage() {
    return this.strategiesPage > 1;
  }

  get totalPages() {
    return Math.ceil(this.strategiesTotal / this.strategiesLimit);
  }

  get activeStrategies() {
    return this.strategies.filter((strategy) => strategy.status === "ACTIVE");
  }

  get pausedStrategies() {
    return this.strategies.filter((strategy) => strategy.status === "PAUSED");
  }

  get stoppedStrategies() {
    return this.strategies.filter((strategy) => strategy.status === "STOPPED");
  }

  get currentFilters() {
    return {
      ...this.filters,
      page: this.strategiesPage,
      limit: this.strategiesLimit,
      search: this.searchQuery.trim() !== "" ? this.searchQuery : undefined,
    };
  }

  get hasActiveFilters() {
    const filterValues = Object.values(this.filters || {});
    return (
      filterValues.some((value) => value !== undefined) ||
      this.searchQuery.trim() !== ""
    );
  }

  // Clear data
  clear() {
    this.currentStrategy = null;
    this.currentStrategyPerformance = null;
    this.strategies = [];
    this.strategyStats = null;
    this.strategiesTotal = 0;
    this.clearFilters();
  }
}
