"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { engineRootStore, type EngineRootStoreType } from "./EngineRootStore";

// Create the context
const EngineStoreContext = createContext<EngineRootStoreType | null>(null);

// Provider component
interface EngineStoreProviderProps {
  children: ReactNode;
}

export function EngineStoreProvider({ children }: EngineStoreProviderProps) {
  useEffect(() => {
    // Initialize the store when the provider mounts
    engineRootStore.initialize().catch((error) => {
      console.error("Failed to initialize engine stores:", error);
    });
  }, []);

  return (
    <EngineStoreContext.Provider value={engineRootStore}>
      {children}
    </EngineStoreContext.Provider>
  );
}

// Hook to use the store context
export function useEngineStore(): EngineRootStoreType {
  const store = useContext(EngineStoreContext);

  if (!store) {
    throw new Error(
      "useEngineStore must be used within an EngineStoreProvider"
    );
  }

  return store;
}

// Individual store hooks for convenience
export function useEngineUserStore() {
  const { userStore } = useEngineStore();
  return userStore;
}

export function useEngineStrategyStore() {
  const { strategyStore } = useEngineStore();
  return strategyStore;
}

export function useEngineOrderStore() {
  const { orderStore } = useEngineStore();
  return orderStore;
}

export function useEnginePortfolioStore() {
  const { portfolioStore } = useEngineStore();
  return portfolioStore;
}

// Hook for engine-specific operations
export function useEngineOperations() {
  const store = useEngineStore();

  return {
    // Authentication
    loginToEngine: store.loginToEngine.bind(store),
    logout: store.logout.bind(store),

    // Data operations
    refreshData: store.refreshEngineData.bind(store),
    initialize: store.initialize.bind(store),

    // State getters
    isLoading: store.isLoading,
    hasError: store.hasError,
    errors: store.errors,
    isEngineConnected: store.isEngineConnected,
    dashboardData: store.dashboardData,
    systemStatus: store.systemStatus,

    // Utilities
    clearAllErrors: store.clearAllErrors.bind(store),
    clearAllData: store.clearAllData.bind(store),
  };
}

// Export the context for advanced usage
export { EngineStoreContext };
export type { EngineRootStoreType };
