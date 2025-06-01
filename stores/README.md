# MobX + tRPC Integration

This directory contains MobX stores that integrate seamlessly with tRPC for state management in the trading application.

## Architecture Overview

The integration follows this pattern:
**React Component → tRPC Hooks → MobX Stores → UI Updates**

### Key Benefits

1. **Reactive UI**: MobX automatically updates components when store data changes
2. **Type Safety**: Full TypeScript support with tRPC-generated types
3. **Optimistic Updates**: Immediate UI feedback with server sync
4. **Centralized State**: All application state managed in MobX stores
5. **Automatic Caching**: tRPC handles query caching and invalidation

## Store Structure

### BaseStore
- Common functionality for all stores
- Loading and error state management
- Async operation wrapper with error handling

### UserStore
- Current user data and profile
- User management (admin features)
- Authentication state
- User statistics and analytics

### StrategyStore
- Strategy list with pagination and filtering
- Current strategy details and performance
- Strategy statistics and analytics
- Computed properties for strategy categorization

### OrderStore
- Orders list with comprehensive filtering
- Order statistics and analytics
- Real-time order status updates
- Computed properties for order analysis

### PortfolioStore
- Positions and balance management
- Portfolio analytics and risk metrics
- Real-time P&L updates
- Portfolio concentration analysis

### RootStore
- Combines all individual stores
- Global state management
- Cross-store operations

## Usage Pattern

### 1. Setup Provider

```tsx
// app/layout.tsx
import { StoreProvider } from '@/stores';
import { TRPCProvider } from '@/lib/trpc/client';

export default function RootLayout({ children }) {
    return (
        <html>
            <body>
                <TRPCProvider>
                    <StoreProvider>
                        {children}
                    </StoreProvider>
                </TRPCProvider>
            </body>
        </html>
    );
}
```

### 2. Component Integration

```tsx
// components/StrategiesList.tsx
'use client';

import { observer } from 'mobx-react-lite';
import { trpc } from '@/lib/trpc/client';
import { useStrategyStore } from '@/stores';

export const StrategiesList = observer(() => {
    const strategyStore = useStrategyStore();

    // tRPC query with MobX store integration
    const { data, isLoading, error } = trpc.strategy.getByUserId.useQuery({
        userId: 'user-123',
        pagination: {
            page: strategyStore.strategiesPage,
            limit: strategyStore.strategiesLimit
        },
        filters: strategyStore.filters
    });

    // tRPC mutation with store updates
    const createMutation = trpc.strategy.create.useMutation({
        onSuccess: (newStrategy) => {
            strategyStore.addStrategy(newStrategy);
        },
        onError: (error) => {
            strategyStore.setError(error.message);
        }
    });

    // Update store when data changes
    useEffect(() => {
        if (data) {
            strategyStore.setStrategies(data.data, data.total);
        }
    }, [data]);

    // Handle pagination
    const handlePageChange = (page: number) => {
        strategyStore.setPage(page);
        // tRPC automatically refetches when dependencies change
    };

    return (
        <div>
            {/* UI components using store data */}
            {strategyStore.strategies.map(strategy => (
                <div key={strategy.id}>{strategy.name}</div>
            ))}
            
            {/* Pagination using store state */}
            <Pagination
                currentPage={strategyStore.strategiesPage}
                totalPages={strategyStore.totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    );
});
```

### 3. Store Methods

#### Data Setters (called from tRPC hooks)
```tsx
// Update store when tRPC data arrives
strategyStore.setStrategies(data.data, data.total);
strategyStore.setCurrentStrategy(strategy);
strategyStore.setStrategyStats(stats);
```

#### State Management
```tsx
// Pagination
strategyStore.setPage(2);
strategyStore.nextPage();
strategyStore.previousPage();

// Filtering
strategyStore.setFilters({ status: 'ACTIVE' });
strategyStore.clearFilters();

// Search
strategyStore.setSearchQuery('momentum');
```

#### Computed Properties
```tsx
// Access computed values
const activeStrategies = strategyStore.activeStrategies;
const hasNextPage = strategyStore.hasNextPage;
const totalPages = strategyStore.totalPages;
```

## Integration Patterns

### 1. Query Integration
```tsx
const { data, isLoading } = trpc.strategy.getAll.useQuery(
    { pagination: store.currentFilters },
    {
        onSuccess: (data) => store.setStrategies(data.data, data.total),
        onError: (error) => store.setError(error.message)
    }
);
```

### 2. Mutation Integration
```tsx
const mutation = trpc.strategy.create.useMutation({
    onMutate: () => store.setLoading(true),
    onSuccess: (newStrategy) => {
        store.addStrategy(newStrategy);
        store.setLoading(false);
    },
    onError: (error) => {
        store.setError(error.message);
        store.setLoading(false);
    }
});
```

### 3. Real-time Updates
```tsx
// WebSocket or polling updates
useEffect(() => {
    const interval = setInterval(() => {
        // Update positions with real-time prices
        portfolioStore.updatePositionsPnL(realTimeUpdates);
    }, 1000);
    
    return () => clearInterval(interval);
}, []);
```

## Best Practices

### 1. Observer Components
Always wrap components that use MobX stores with `observer`:
```tsx
export const MyComponent = observer(() => {
    const store = useStrategyStore();
    return <div>{store.strategies.length}</div>;
});
```

### 2. Error Handling
Use store error state for consistent error handling:
```tsx
if (store.error) {
    return <ErrorMessage message={store.error} />;
}
```

### 3. Loading States
Combine tRPC and store loading states:
```tsx
const isLoading = tRPCLoading || store.isLoading;
```

### 4. Optimistic Updates
Update store immediately, then sync with server:
```tsx
const handleDelete = async (id: string) => {
    // Optimistic update
    store.removeStrategy(id);
    
    try {
        await deleteMutation.mutateAsync({ id });
    } catch (error) {
        // Revert on error
        store.addStrategy(originalStrategy);
    }
};
```

### 5. Type Safety
Use tRPC-generated types for store data:
```tsx
type Strategy = RouterOutputs['strategy']['getById'];
```

## Store Hooks

```tsx
// Individual store hooks
const userStore = useUserStore();
const strategyStore = useStrategyStore();
const orderStore = useOrderStore();
const portfolioStore = usePortfolioStore();

// Root store hook
const stores = useStores();
```

## Example Components

See `components/examples/StrategiesExample.tsx` for a complete implementation example showing:
- tRPC query integration
- Mutation handling
- Store state management
- Pagination and filtering
- Error handling
- Loading states
- Computed properties

## Performance Considerations

1. **Selective Observing**: Only observe the specific store properties you need
2. **Computed Properties**: Use MobX computed values for derived data
3. **Batch Updates**: MobX automatically batches updates for optimal performance
4. **Query Optimization**: Use tRPC's built-in caching and invalidation

## Debugging

1. **MobX DevTools**: Install MobX DevTools browser extension
2. **tRPC DevTools**: Use @tanstack/react-query-devtools
3. **Store Logging**: Add console.log in store methods for debugging
4. **React DevTools**: Use React DevTools to inspect component re-renders 