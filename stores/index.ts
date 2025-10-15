// Store exports for the trading frontend
// Note: MobX stores have been removed and replaced with React Query hooks
// All data fetching is now handled through hooks/useTradingApi.ts

// Legacy compatibility exports - these are now empty and should be removed
// from components that still import them
export const StoreProvider = null;
export const useStores = () => ({});
export const useStrategyStore = () => ({});
export const useOrderStore = () => ({});
export const useUserStore = () => ({});
export const usePortfolioStore = () => ({});
