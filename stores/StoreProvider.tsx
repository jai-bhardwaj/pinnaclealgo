'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { enableStaticRendering } from 'mobx-react-lite';
import { rootStore, RootStoreType } from './RootStore';

// Enable static rendering for SSR
enableStaticRendering(typeof window === 'undefined');

// Create the context
const StoreContext = createContext<RootStoreType | null>(null);

// Provider component
export function StoreProvider({ children }: { children: ReactNode }) {
    return (
        <StoreContext.Provider value={rootStore}>
            {children}
        </StoreContext.Provider>
    );
}

// Hook to use the stores
export function useStores() {
    const store = useContext(StoreContext);
    if (!store) {
        throw new Error('useStores must be used within StoreProvider');
    }
    return store;
}

// Individual store hooks for convenience
export function useUserStore() {
    return useStores().userStore;
}

export function useStrategyStore() {
    return useStores().strategyStore;
}

export function useOrderStore() {
    return useStores().orderStore;
}

export function usePortfolioStore() {
    return useStores().portfolioStore;
} 