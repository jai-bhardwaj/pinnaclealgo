import { vanillaTrpc } from '@/lib/trpc/client';
import type { RouterOutputs } from '@/lib/trpc/client';

// Use the actual tRPC Strategy type but create an alias for the frontend
export type Strategy = RouterOutputs['strategy']['getAll'][0];
export type StrategyById = RouterOutputs['strategy']['getById'];

// Update request interface
export interface StrategyUpdateRequest {
  margin?: number;
  marginType?: 'percentage' | 'rupees';
  status?: 'active' | 'inactive';
  name?: string;
  description?: string;
  basePrice?: number;
}

// Response interfaces
export interface SquareOffResponse {
  message: string;
  success: boolean;
}

// Helper function to transform strategy data to match frontend expectations
function transformStrategy(strategy: any): Strategy {
  return {
    id: strategy.id,
    name: strategy.name,
    margin: strategy.margin || 5,
    marginType: strategy.marginType || 'percentage',
    basePrice: strategy.basePrice || 50000,
    status: strategy.status?.toLowerCase() === 'active' ? 'active' : 'inactive',
    lastUpdated: strategy.updatedAt?.toLocaleDateString() || strategy.lastUpdated || new Date().toLocaleDateString(),
    user_id: strategy.userId,
    description: strategy.description,
    strategyType: strategy.strategyType,
    assetClass: strategy.assetClass,
    symbols: strategy.symbols,
    timeframe: strategy.timeframe,
    parameters: strategy.parameters,
    riskParameters: strategy.riskParameters,
    isLive: strategy.isLive,
    isPaperTrading: strategy.isPaperTrading,
    maxPositions: strategy.maxPositions,
    capitalAllocated: strategy.capitalAllocated,
    totalPnl: strategy.totalPnl,
    totalTrades: strategy.totalTrades,
    winRate: strategy.winRate,
  };
}

// Backend API client that wraps tRPC calls
export const backendApi = {
  strategies: {
    // Get all strategies for the current user
    async getAll(): Promise<Strategy[]> {
      try {
        const strategies = await vanillaTrpc.strategy.getAll.query();
        return strategies.map(transformStrategy);
      } catch (error) {
        console.error('Error fetching strategies:', error);
        throw new Error('Failed to load strategies. Please check your connection and try again.');
      }
    },

    // Update a strategy
    async update(id: string, data: StrategyUpdateRequest): Promise<Strategy> {
      try {
        // Map frontend status to backend StrategyStatus enum
        const updateData: any = { ...data };
        if (data.status) {
          updateData.status = data.status.toUpperCase(); // Convert to ACTIVE/INACTIVE for Prisma enum
        }
        
        const updatedStrategy = await vanillaTrpc.strategy.update.mutate({
          id,
          ...updateData,
        });
        return transformStrategy(updatedStrategy);
      } catch (error) {
        console.error('Error updating strategy:', error);
        throw new Error('Failed to update strategy. Please try again.');
      }
    },

    // Square off a specific strategy
    async squareOff(strategyId: string): Promise<SquareOffResponse> {
      try {
        const result = await vanillaTrpc.strategy.squareOff.mutate({ id: strategyId });
        return result;
      } catch (error) {
        console.error('Error squaring off strategy:', error);
        throw new Error('Failed to square off strategy. Please try again.');
      }
    },

    // Square off all strategies
    async squareOffAll(): Promise<SquareOffResponse> {
      try {
        const result = await vanillaTrpc.strategy.squareOffAll.mutate();
        return result;
      } catch (error) {
        console.error('Error squaring off all strategies:', error);
        throw new Error('Failed to square off all strategies. Please try again.');
      }
    },

    // Initialize default strategies
    async initialize(): Promise<Strategy[]> {
      try {
        const strategies = await vanillaTrpc.strategy.initialize.mutate();
        return strategies.map(transformStrategy);
      } catch (error) {
        console.error('Error initializing strategies:', error);
        throw new Error('Failed to initialize strategies. Please try again.');
      }
    },

    // Create a new strategy
    async create(strategyData: {
      name: string;
      description?: string;
      strategyType: string;
      margin?: number;
      marginType?: 'percentage' | 'rupees';
      basePrice?: number;
      status?: 'active' | 'inactive';
      assetClass?: string;
      symbols?: string[];
      timeframe?: string;
      parameters?: any;
      riskParameters?: any;
      isPaperTrading?: boolean;
      maxPositions?: number;
      capitalAllocated: number; // Make this required to fix the type error
    }): Promise<Strategy> {
      try {
        // Convert frontend data to backend format
        // Note: User ID should be extracted from the authenticated session on the backend
        const backendData = {
          ...strategyData,
          // Remove hardcoded user connection - should be handled by backend auth
          assetClass: strategyData.assetClass as any || 'EQUITY',
          timeframe: strategyData.timeframe as any || 'MINUTE_5',
          status: strategyData.status?.toUpperCase() as any || 'DRAFT',
        };
        
        const newStrategy = await vanillaTrpc.strategy.create.mutate(backendData);
        return newStrategy as unknown as Strategy;
      } catch (error) {
        console.error('Error creating strategy:', error);
        throw new Error('Failed to create strategy. Please try again.');
      }
    },

    // Delete a strategy
    async delete(strategyId: string): Promise<{ success: boolean }> {
      try {
        await vanillaTrpc.strategy.remove.mutate({ id: strategyId });
        return { success: true };
      } catch (error) {
        console.error('Error deleting strategy:', error);
        throw new Error('Failed to delete strategy. Please try again.');
      }
    },

    // Get strategy by ID
    async getById(strategyId: string): Promise<Strategy> {
      try {
        const strategy = await vanillaTrpc.strategy.getById.query({ id: strategyId });
        return transformStrategy(strategy);
      } catch (error) {
        console.error('Error fetching strategy:', error);
        throw new Error('Failed to load strategy. Please try again.');
      }
    },

    // Start a strategy
    async start(strategyId: string): Promise<Strategy> {
      try {
        const strategy = await vanillaTrpc.strategy.start.mutate({ id: strategyId });
        return transformStrategy(strategy);
      } catch (error) {
        console.error('Error starting strategy:', error);
        throw new Error('Failed to start strategy. Please try again.');
      }
    },

    // Stop a strategy
    async stop(strategyId: string): Promise<Strategy> {
      try {
        const strategy = await vanillaTrpc.strategy.stop.mutate({ id: strategyId });
        return transformStrategy(strategy);
      } catch (error) {
        console.error('Error stopping strategy:', error);
        throw new Error('Failed to stop strategy. Please try again.');
      }
    },

    // Pause a strategy
    async pause(strategyId: string): Promise<Strategy> {
      try {
        const strategy = await vanillaTrpc.strategy.pause.mutate({ id: strategyId });
        return transformStrategy(strategy);
      } catch (error) {
        console.error('Error pausing strategy:', error);
        throw new Error('Failed to pause strategy. Please try again.');
      }
    },
  },
};

// Re-export the Strategy type for components to use
export type { Strategy, StrategyUpdateRequest, SquareOffResponse }; 