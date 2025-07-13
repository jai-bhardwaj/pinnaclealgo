# MobX Stores

This directory contains MobX stores for state management in the application.

## OrderPageModel

The `OrderPageModel` is a MobX store that manages the state for the orders page. It handles:

- **State Management**: Orders data, pagination, filters, loading states, and errors
- **API Integration**: Fetches orders and summary data from the backend
- **Reactive Updates**: Automatically updates the UI when data changes
- **Filtering & Search**: Handles status filters, date ranges, and search queries
- **Pagination**: Manages page navigation and page size changes

### Key Features

- **Reactive State**: Uses MobX's `makeAutoObservable` for automatic reactivity
- **Error Handling**: Comprehensive error states for both orders and summary data
- **Loading States**: Separate loading states for orders and summary data
- **Date Filtering**: Supports Today, This Week, Last Week, and All time periods
- **Status Filtering**: Filter orders by status (Pending, Open, Complete, etc.)
- **Search**: Client-side search for better UX
- **Pagination**: Server-side pagination with configurable page sizes

### Usage

```typescript
import { orderPageModel } from '@/stores/OrderPageModel';

// Initialize with user ID
await orderPageModel.initialize(userId);

// Update filters
orderPageModel.setStatusFilter('COMPLETE');
orderPageModel.setMode('today');

// Refresh data
await orderPageModel.refresh();

// Access reactive data
const orders = orderPageModel.orders;
const summary = orderPageModel.summaryStats;
```

### Components

The orders page uses these components:

- `OrderPage`: Main page component using MobX observer
- `OrdersTable`: Table component with search, filters, and pagination
- `Pagination`: Reusable pagination component
- `PageSizeSelector`: Page size selection component

### Types

All types and interfaces are centralized in `@/types/orders.ts`:

- `Order`: Order data structure
- `SummaryStats`: Summary statistics interface
- `PaginationState`: Pagination state interface
- `FilterState`: Filter state interface
- `OrdersTableProps`: OrdersTable component props
- `STATUS_CONFIG`: Status configuration constants
- `STATUS_OPTIONS`: Status filter options
- `MODES`: Date filter mode options

### Data Flow

1. **Initialization**: User ID is set and initial data is fetched
2. **Filter Changes**: Trigger new API calls with updated parameters
3. **Pagination**: Page changes trigger new order fetches
4. **Refresh**: Manual refresh updates both orders and summary
5. **Reactive Updates**: UI automatically updates when MobX state changes

### API Integration

The model integrates with the trading engine API:

- `tradingEngineApi.getOrders()`: Fetches paginated orders
- `tradingEngineApi.getOrdersSummary()`: Fetches summary statistics

All API calls include proper error handling and loading state management.

### File Organization

```
stores/
├── OrderPageModel.ts          # MobX store for orders page
└── README.md                  # This documentation

types/
└── orders.ts                  # All order-related types and interfaces

components/
├── orders/
│   └── orders-table.tsx       # Orders table component
└── ui/
    ├── pagination.tsx         # Pagination component
    └── page-size-selector.tsx # Page size selector
```

This organization provides:
- **Separation of Concerns**: Types are separate from implementation
- **Reusability**: Types can be imported by multiple components
- **Maintainability**: Easy to update types in one place
- **Type Safety**: Full TypeScript support across the application 