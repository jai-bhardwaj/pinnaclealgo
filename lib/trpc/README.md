# tRPC Setup for Trading Platform

## Overview

This directory contains the complete tRPC setup for the trading platform, providing type-safe API communication between the frontend and backend services.

## Architecture

```
MobX Models → tRPC → Services → Prisma → Database
```

## Directory Structure

```
lib/trpc/
├── trpc.ts              # Core tRPC configuration
├── schemas.ts           # Zod validation schemas
├── client.ts            # Client-side tRPC setup
├── root.ts              # Main router combining all sub-routers
├── routers/
│   ├── user.ts          # User management routes
│   ├── strategy.ts      # Strategy management routes
│   ├── order.ts         # Order management routes
│   └── portfolio.ts     # Portfolio & position routes
└── README.md           # This documentation
```

## Features

### 🔐 Authentication & Authorization
- **Protected Procedures**: Require user authentication
- **Admin Procedures**: Require admin role
- **User Isolation**: Users can only access their own data
- **Role-based Access**: Different permissions for different user roles

### 📊 Complete API Coverage
- **User Management**: CRUD, authentication, 2FA, profiles
- **Strategy Management**: Lifecycle, performance tracking, logging
- **Order Management**: Placement, execution, cancellation, analytics
- **Portfolio Management**: Positions, balances, risk metrics

### 🛡️ Type Safety
- **End-to-end Type Safety**: From database to frontend
- **Zod Validation**: Input validation with detailed error messages
- **TypeScript Inference**: Automatic type inference for inputs/outputs

### ⚡ Performance
- **Batch Requests**: Multiple requests in single HTTP call
- **Optimistic Updates**: Immediate UI updates
- **Caching**: React Query integration for smart caching
- **Pagination**: Built-in pagination support

## Usage Examples

### Client-side Usage

```typescript
import { trpc } from '@/lib/trpc/client';

// In a React component
function UserProfile() {
  const { data: user, isLoading } = trpc.user.me.useQuery();
  const updateProfile = trpc.user.updateProfile.useMutation();

  const handleUpdate = async (profileData) => {
    await updateProfile.mutateAsync(profileData);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user?.username}</h1>
      {/* Profile form */}
    </div>
  );
}
```

### Server-side Usage

```typescript
// In a server component or API route
import { createTRPCContext } from '@/lib/trpc/trpc';
import { appRouter } from '@/lib/trpc/root';

const ctx = await createTRPCContext({ req, res });
const caller = appRouter.createCaller(ctx);

const user = await caller.user.me();
```

## API Routes

### User Routes (`trpc.user.*`)

**Public Routes:**
- `create` - Register new user
- `validateCredentials` - Login validation
- `verifyEmail` - Email verification

**Protected Routes:**
- `me` - Get current user
- `getById` - Get user by ID (own or admin)
- `update` - Update user data
- `updateProfile` - Update user profile
- `getProfile` - Get user profile
- `changePassword` - Change password
- `enableTwoFactor` - Enable 2FA
- `verifyTwoFactor` - Verify 2FA token
- `disableTwoFactor` - Disable 2FA
- `sendVerificationEmail` - Send verification email
- `getStats` - Get user statistics

**Admin Routes:**
- `getAll` - Get all users (paginated)
- `search` - Search users
- `activate` - Activate user
- `deactivate` - Deactivate user
- `suspend` - Suspend user
- `changeRole` - Change user role
- `delete` - Delete user
- `bulkUpdate` - Bulk update users
- `bulkDelete` - Bulk delete users

### Strategy Routes (`trpc.strategy.*`)

**Protected Routes:**
- `create` - Create strategy
- `getById` - Get strategy by ID
- `getMyStrategies` - Get user's strategies
- `update` - Update strategy
- `delete` - Delete strategy
- `start` - Start strategy
- `pause` - Pause strategy
- `stop` - Stop strategy
- `updatePerformance` - Update performance metrics
- `getPerformance` - Get performance data
- `addLog` - Add strategy log
- `getLogs` - Get strategy logs
- `search` - Search strategies
- `getStats` - Get strategy statistics
- `clone` - Clone strategy

**Admin Routes:**
- `getAllStrategies` - Get all strategies
- `bulkUpdate` - Bulk update strategies
- `bulkDelete` - Bulk delete strategies
- `getAllStats` - Get global statistics

### Order Routes (`trpc.order.*`)

**Protected Routes:**
- `create` - Create order
- `getById` - Get order by ID
- `getMyOrders` - Get user's orders
- `update` - Update order
- `delete` - Delete order
- `place` - Place order
- `execute` - Execute order
- `cancel` - Cancel order
- `reject` - Reject order
- `getStats` - Get order statistics
- `getHistory` - Get order history
- `getOpenOrdersValue` - Get open orders value
- `getBySymbol` - Get orders by symbol
- `search` - Search orders
- `bulkUpdate` - Bulk update orders
- `bulkCancel` - Bulk cancel orders

**Admin Routes:**
- `getAllOrders` - Get all orders
- `getAllStats` - Get global order statistics
- `adminBulkUpdate` - Admin bulk update
- `adminBulkCancel` - Admin bulk cancel

### Portfolio Routes (`trpc.portfolio.*`)

**Protected Routes:**
- `createPosition` - Create position
- `getPositionById` - Get position by ID
- `getMyPositions` - Get user's positions
- `updatePosition` - Update position
- `deletePosition` - Delete position
- `updatePositionPnL` - Update position P&L
- `getBalance` - Get user balance
- `updateBalance` - Update balance
- `getSummary` - Get portfolio summary
- `getPerformance` - Get portfolio performance
- `getRisk` - Get risk metrics
- `getPositionsBySymbol` - Group by symbol
- `getPositionsByExchange` - Group by exchange
- `bulkUpdatePositions` - Bulk update positions
- `closeAllPositions` - Close all positions

**Admin Routes:**
- `getAllPositions` - Get all positions
- `getUserBalance` - Get user balance
- `updateUserBalance` - Update user balance
- `getUserPortfolioSummary` - Get user portfolio summary
- `getUserPortfolioRisk` - Get user portfolio risk

## Error Handling

All procedures include comprehensive error handling:

```typescript
try {
  const result = await trpc.user.create.mutate(userData);
} catch (error) {
  if (error.data?.code === 'CONFLICT') {
    // Handle duplicate user
  } else if (error.data?.code === 'BAD_REQUEST') {
    // Handle validation errors
    console.log(error.data.zodError);
  }
}
```

## Validation Schemas

All inputs are validated using Zod schemas defined in `schemas.ts`:

```typescript
// Example: Creating a user
const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  // ... other fields
});
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next superjson @tanstack/react-query @tanstack/react-query-devtools
```

### 2. Add to Root Layout

```typescript
// app/layout.tsx
import { TRPCProvider } from '@/components/providers/trpc-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
```

### 3. Environment Variables

```env
# .env.local
DATABASE_URL="your-database-url"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Development

### Adding New Procedures

1. **Add to Service**: Create the service function in `services/`
2. **Add Schema**: Define Zod validation schema in `schemas.ts`
3. **Add to Router**: Add the procedure to appropriate router
4. **Update Types**: TypeScript will automatically infer types

### Testing

```typescript
// Example test
import { createTRPCMsw } from 'msw-trpc';
import { appRouter } from '@/lib/trpc/root';

const trpcMsw = createTRPCMsw(appRouter);

// Mock a procedure
const handlers = [
  trpcMsw.user.me.query(() => {
    return { id: '1', username: 'testuser' };
  }),
];
```

## Best Practices

### 1. Input Validation
- Always use Zod schemas for input validation
- Provide meaningful error messages
- Validate on both client and server

### 2. Authorization
- Check user permissions in every protected procedure
- Use middleware for common authorization logic
- Implement proper role-based access control

### 3. Error Handling
- Use appropriate HTTP status codes
- Provide detailed error messages for development
- Log errors for monitoring

### 4. Performance
- Use pagination for large datasets
- Implement proper caching strategies
- Optimize database queries in services

### 5. Type Safety
- Leverage TypeScript inference
- Use proper return types
- Validate all inputs and outputs

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure all schemas match service function signatures
2. **Authentication**: Check session configuration and middleware
3. **CORS**: Configure CORS for cross-origin requests
4. **Caching**: Clear React Query cache during development

### Debug Mode

Enable debug logging:

```typescript
// In development
const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: () => true, // Always log in development
    }),
    // ... other links
  ],
});
```

This tRPC setup provides a robust, type-safe API layer for the trading platform with comprehensive features for user management, trading operations, and portfolio management. 