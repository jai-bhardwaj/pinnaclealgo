# Trading Platform Services Architecture

## Overview

This services layer provides clean, reusable functions that interact directly with the Prisma database client. The architecture follows the pattern:

```
MobX Models → tRPC → Services → Prisma → Database
```

## Architecture Benefits

- **Clean Separation**: Services are pure functions that handle database operations
- **Type Safety**: Full TypeScript support with Prisma-generated types
- **Reusability**: Functions can be used across different tRPC procedures
- **Testability**: Easy to unit test individual service functions
- **Performance**: Direct Prisma queries with optimized includes and selects

## Services Structure

```
services/
├── prisma.ts              # Prisma client instance
├── types.ts               # TypeScript interfaces and enums
├── user.service.ts        # User management functions
├── strategy.service.ts    # Strategy operations
├── order.service.ts       # Order management
├── portfolio.service.ts   # Portfolio and positions
├── index.ts              # Main exports
└── README.md             # This documentation
```

## Service Functions

### User Service (`user.service.ts`)

**CRUD Operations:**
- `createUser(userData)` - Create new user with default profile, risk profile, and balance
- `getUserById(id)` - Get user with all related data
- `getUserByEmail(email)` - Find user by email
- `getUserByUsername(username)` - Find user by username
- `updateUser(id, userData)` - Update user information
- `deleteUser(id)` - Delete user and cascade relations
- `getUsers(pagination, filters)` - Get paginated users with filtering

**Profile Management:**
- `getUserProfile(userId)` - Get user profile
- `updateUserProfile(userId, profileData)` - Update user profile

**Status Management:**
- `activateUser(id)` - Set user status to ACTIVE
- `deactivateUser(id)` - Set user status to INACTIVE
- `suspendUser(id, reason)` - Suspend user account
- `changeUserRole(id, role)` - Change user role

**Authentication:**
- `validateUserCredentials(usernameOrEmail, password)` - Validate login
- `changePassword(id, currentPassword, newPassword)` - Change password
- `enableTwoFactor(id)` - Enable 2FA
- `verifyTwoFactor(id, token)` - Verify 2FA token

**Analytics:**
- `getUserStats(id)` - Get user statistics
- `searchUsers(query, filters)` - Search users
- `bulkUpdateUsers(userIds, updateData)` - Bulk operations

### Strategy Service (`strategy.service.ts`)

**CRUD Operations:**
- `createStrategy(strategyData)` - Create new strategy
- `getStrategyById(id)` - Get strategy with full details
- `getStrategiesByUserId(userId, pagination, filters)` - Get user strategies
- `updateStrategy(id, strategyData)` - Update strategy
- `deleteStrategy(id)` - Delete strategy

**Status Management:**
- `startStrategy(id)` - Start strategy execution
- `pauseStrategy(id)` - Pause strategy
- `stopStrategy(id)` - Stop strategy

**Performance Tracking:**
- `updateStrategyPerformance(id, performance)` - Update performance metrics
- `getStrategyPerformance(id)` - Get detailed performance data
- `getStrategyStats(userId)` - Get strategy statistics

**Logging:**
- `addStrategyLog(strategyId, level, message, data)` - Add log entry
- `getStrategyLogs(strategyId, pagination, filters)` - Get strategy logs

**Utilities:**
- `searchStrategies(query, filters)` - Search strategies
- `cloneStrategy(id, newName, userId)` - Clone existing strategy
- `bulkUpdateStrategies(strategyIds, updateData)` - Bulk operations

### Order Service (`order.service.ts`)

**CRUD Operations:**
- `createOrder(orderData)` - Create new order
- `getOrderById(id)` - Get order with full details
- `getOrdersByUserId(userId, pagination, filters)` - Get user orders
- `updateOrder(id, orderData)` - Update order
- `deleteOrder(id)` - Delete order

**Order Lifecycle:**
- `placeOrder(id, brokerOrderId)` - Mark order as placed
- `executeOrder(id, filledQuantity, averagePrice)` - Execute order
- `cancelOrder(id, reason)` - Cancel order
- `rejectOrder(id, reason)` - Reject order

**Analytics:**
- `getOrderStats(userId, strategyId)` - Get order statistics
- `getOrderHistory(userId, startDate, endDate)` - Get order history
- `searchOrders(query, filters)` - Search orders

**Risk Management:**
- `getOpenOrdersValue(userId)` - Calculate open orders value
- `getOrdersBySymbol(userId, symbol)` - Get orders for specific symbol

**Bulk Operations:**
- `bulkUpdateOrders(orderIds, updateData)` - Bulk update
- `bulkCancelOrders(orderIds, reason)` - Bulk cancel

### Portfolio Service (`portfolio.service.ts`)

**Position Management:**
- `createPosition(positionData)` - Create new position
- `getPositionById(id)` - Get position details
- `getPositionsByUserId(userId, pagination, filters)` - Get user positions
- `updatePosition(id, positionData)` - Update position
- `deletePosition(id)` - Delete position
- `updatePositionPnL(id, lastTradedPrice, dayChange, dayChangePct)` - Update P&L

**Balance Management:**
- `getUserBalance(userId)` - Get user balance
- `updateUserBalance(userId, balanceData)` - Update balance

**Portfolio Analytics:**
- `getPortfolioSummary(userId)` - Get portfolio overview
- `getPortfolioPerformance(userId, startDate, endDate)` - Get performance metrics
- `getPortfolioRisk(userId)` - Calculate risk metrics

**Aggregation:**
- `getPositionsBySymbol(userId)` - Group positions by symbol
- `getPositionsByExchange(userId)` - Group positions by exchange

**Utilities:**
- `bulkUpdatePositions(positionIds, updateData)` - Bulk operations
- `closeAllPositions(userId)` - Close all positions

## Usage Examples

### Creating a User with tRPC

```typescript
// In your tRPC router
import { createUser } from '@/services';

export const userRouter = router({
  create: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      return await createUser(input);
    }),
});
```

### Using in MobX Store

```typescript
// In your MobX store
import { trpc } from '@/lib/trpc';

class UserStore {
  async createUser(userData: CreateUserData) {
    const user = await trpc.user.create.mutate(userData);
    // Update store state
    this.users.push(user);
    return user;
  }
}
```

### Direct Service Usage (for server-side)

```typescript
import { getUserById, updateUserBalance } from '@/services';

// Get user with full details
const user = await getUserById('user-id');

// Update user balance
await updateUserBalance('user-id', {
  availableCash: 50000,
  totalBalance: 50000
});
```

## Type Safety

All services use TypeScript interfaces defined in `types.ts`:

```typescript
// Example usage with full type safety
const user: User = await createUser({
  email: 'user@example.com',
  username: 'trader1',
  password: 'securepassword',
  role: UserRole.USER,
  status: UserStatus.ACTIVE
});
```

## Error Handling

Services throw errors that should be caught by tRPC procedures:

```typescript
export const userRouter = router({
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      try {
        const user = await getUserById(input);
        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found'
          });
        }
        return user;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user'
        });
      }
    }),
});
```

## Performance Considerations

### Optimized Queries

Services use Prisma's `include` and `select` to fetch only needed data:

```typescript
// Efficient query with specific includes
return prisma.user.findUnique({
  where: { id },
  include: {
    profile: true,
    riskProfile: true,
    balance: true,
    _count: {
      select: {
        strategies: true,
        orders: true,
        trades: true
      }
    }
  }
});
```

### Pagination

All list functions support pagination:

```typescript
const result = await getUsers(
  { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' },
  { role: 'USER', status: 'ACTIVE' }
);
```

### Bulk Operations

Use bulk operations for better performance:

```typescript
// Update multiple users at once
await bulkUpdateUsers(['id1', 'id2'], { status: UserStatus.ACTIVE });
```

## Testing

Services can be easily unit tested:

```typescript
import { createUser, getUserById } from '@/services';

describe('User Service', () => {
  it('should create user with default profile', async () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    };
    
    const user = await createUser(userData);
    
    expect(user.email).toBe(userData.email);
    expect(user.profile).toBeDefined();
    expect(user.riskProfile).toBeDefined();
    expect(user.balance).toBeDefined();
  });
});
```

## Best Practices

1. **Keep Functions Pure**: Services should not have side effects beyond database operations
2. **Use Transactions**: For operations that modify multiple tables
3. **Validate Input**: Use Zod schemas in tRPC procedures before calling services
4. **Handle Errors**: Always handle potential database errors
5. **Optimize Queries**: Use `select` and `include` appropriately
6. **Use Bulk Operations**: For better performance with multiple records
7. **Add Logging**: Use strategy logs for debugging and monitoring

## Adding New Services

To add a new service:

1. Create `new-service.service.ts`
2. Define functions following the existing patterns
3. Add exports to `index.ts`
4. Update this README
5. Create corresponding tRPC procedures
6. Add MobX store integration

## Database Schema

Services work with the Prisma schema defined in `prisma/schema.prisma`. Key models:

- **User**: Core user data with relations to profile, balance, risk profile
- **Strategy**: Trading strategies with performance tracking
- **Order**: Order management with status tracking
- **Trade**: Executed trades with P&L calculation
- **Position**: Current positions with real-time P&L
- **Balance**: User account balance and buying power

This architecture provides a solid foundation for building scalable trading platform features with full type safety and excellent developer experience. 