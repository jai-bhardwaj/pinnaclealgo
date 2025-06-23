import { makeAutoObservable } from "mobx";
import EngineUserStore from "./EngineUserStore";
import EngineStrategyStore from "./EngineStrategyStore";
import EngineOrderStore from "./EngineOrderStore";
import { PortfolioStore } from "./PortfolioStore"; // Keep existing portfolio store for now

export class EngineRootStore {
  userStore: EngineUserStore;
  strategyStore: EngineStrategyStore;
  orderStore: EngineOrderStore;
  portfolioStore: PortfolioStore;

  constructor() {
    this.userStore = new EngineUserStore();
    this.strategyStore = new EngineStrategyStore();
    this.orderStore = new EngineOrderStore();
    this.portfolioStore = new PortfolioStore(); // Keep existing for now

    makeAutoObservable(this);
  }

  // Global loading state
  get isLoading() {
    return (
      this.userStore.isLoading ||
      this.strategyStore.isLoading ||
      this.orderStore.isLoading ||
      this.portfolioStore.isLoading
    );
  }

  // Global error state
  get hasError() {
    return !!(
      this.userStore.error ||
      this.strategyStore.error ||
      this.orderStore.error ||
      this.portfolioStore.error
    );
  }

  get errors() {
    const errors: string[] = [];
    if (this.userStore.error) errors.push(`User: ${this.userStore.error}`);
    if (this.strategyStore.error)
      errors.push(`Strategy: ${this.strategyStore.error}`);
    if (this.orderStore.error) errors.push(`Order: ${this.orderStore.error}`);
    if (this.portfolioStore.error)
      errors.push(`Portfolio: ${this.portfolioStore.error}`);
    return errors;
  }

  // Clear all errors
  clearAllErrors() {
    this.userStore.clearError();
    this.strategyStore.clearError();
    this.orderStore.clearError();
    this.portfolioStore.clearError();
  }

  // Clear all data (useful for logout)
  clearAllData() {
    this.userStore.clear();
    this.strategyStore.clear();
    this.orderStore.clear();
    this.portfolioStore.clear();
  }

  // Logout action
  logout() {
    this.userStore.logout();
    this.strategyStore.clear();
    this.orderStore.clear();
    this.portfolioStore.clear();
  }

  // Initialize all stores with engine data
  async initialize() {
    try {
      // If user is authenticated, fetch initial data
      if (this.userStore.isAuthenticated) {
        // Fetch marketplace data first
        await this.strategyStore.fetchMarketplace();

        // Then fetch user-specific data
        await Promise.all([
          this.userStore.fetchUserDashboard(),
          this.strategyStore.fetchUserDashboard(),
          this.orderStore.fetchUserDashboard(),
        ]);
      }
    } catch (error) {
      console.error("Failed to initialize stores:", error);
    }
  }

  // Engine-specific methods
  async loginToEngine(userId: string, apiKey: string) {
    await this.userStore.login(userId, apiKey);

    // After login, initialize all data
    await this.initialize();
  }

  async refreshEngineData() {
    if (!this.userStore.isAuthenticated) {
      return;
    }

    try {
      await Promise.all([
        this.strategyStore.fetchUserDashboard(),
        this.orderStore.fetchUserDashboard(),
        this.userStore.fetchUserDashboard(),
      ]);
    } catch (error) {
      console.error("Failed to refresh engine data:", error);
    }
  }

  // Get consolidated dashboard data
  get dashboardData() {
    const userData = this.userStore.dashboardData;
    const strategies = this.strategyStore.userStrategies;
    const orders = this.orderStore.orders;

    return {
      user: userData?.user_info || this.userStore.currentUser,
      strategies: strategies,
      orders: orders,
      systemStatus: userData?.system_status,
      portfolioSummary: userData?.portfolio_summary,
    };
  }

  // Get system health status
  get systemStatus() {
    return this.userStore.dashboardData?.system_status || null;
  }

  // Check if engine is connected
  get isEngineConnected() {
    return this.userStore.isAuthenticated && !this.hasError;
  }
}

// Create a singleton instance for engine integration
export const engineRootStore = new EngineRootStore();

// Export the store type for TypeScript
export type EngineRootStoreType = EngineRootStore;
