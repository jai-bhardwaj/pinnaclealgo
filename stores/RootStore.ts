import { makeAutoObservable } from 'mobx';
import { UserStore } from './UserStore';
import { StrategyStore } from './StrategyStore';
import { OrderStore } from './OrderStore';
import { PortfolioStore } from './PortfolioStore';

export class RootStore {
    userStore: UserStore;
    strategyStore: StrategyStore;
    orderStore: OrderStore;
    portfolioStore: PortfolioStore;

    constructor() {
        this.userStore = new UserStore();
        this.strategyStore = new StrategyStore();
        this.orderStore = new OrderStore();
        this.portfolioStore = new PortfolioStore();

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
        if (this.strategyStore.error) errors.push(`Strategy: ${this.strategyStore.error}`);
        if (this.orderStore.error) errors.push(`Order: ${this.orderStore.error}`);
        if (this.portfolioStore.error) errors.push(`Portfolio: ${this.portfolioStore.error}`);
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
}

// Create a singleton instance
export const rootStore = new RootStore();

// Export the store type for TypeScript
export type RootStoreType = RootStore; 