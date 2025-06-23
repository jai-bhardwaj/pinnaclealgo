// Store exports for the trading frontend
export {
  EngineStoreProvider,
  useEngineStore,
  useEngineUserStore,
  useEngineStrategyStore,
  useEngineOrderStore,
  useEnginePortfolioStore,
  useEngineOperations,
  EngineStoreContext,
} from "./EngineStoreProvider";

export { EngineRootStore, engineRootStore } from "./EngineRootStore";
export { EngineUserStore } from "./EngineUserStore";
export { EngineOrderStore } from "./EngineOrderStore";
export { EngineStrategyStore } from "./EngineStrategyStore";
export { PortfolioStore } from "./PortfolioStore";

// Import for re-export
import {
  EngineStoreProvider as _EngineStoreProvider,
  useEngineStore as _useEngineStore,
  useEngineStrategyStore as _useEngineStrategyStore,
  useEngineOrderStore as _useEngineOrderStore,
  useEngineUserStore as _useEngineUserStore,
  useEnginePortfolioStore as _useEnginePortfolioStore,
} from "./EngineStoreProvider";

// Legacy compatibility exports
export const StoreProvider = _EngineStoreProvider;
export const useStores = _useEngineStore;
export const useStrategyStore = _useEngineStrategyStore;
export const useOrderStore = _useEngineOrderStore;
export const useUserStore = _useEngineUserStore;
export const usePortfolioStore = _useEnginePortfolioStore;
