import { formatDate } from "@/lib/utils";

// Mock Strategy type since tRPC isn't fully implemented
export interface Strategy {
  id: string;
  name: string;
  status: "active" | "inactive";
  lastUpdated: string;
  user_id: string;
  description?: string;
  strategyType: string;
  assetClass?: string;
  symbols?: string[];
  timeframe?: string;
  parameters?: any;
  riskParameters?: any;
  maxPositions?: number;
  capitalAllocated: number;
  totalPnl?: number;
  totalTrades?: number;
  winRate?: number;
}

export type StrategyById = Strategy;

// Update request interface
export interface StrategyUpdateRequest {
  status?: "active" | "inactive";
  name?: string;
  description?: string;
}

// Response interfaces
export interface SquareOffResponse {
  message: string;
  success: boolean;
}

// Helper function to transform strategy data to match frontend expectations
function transformStrategy(strategy: any): Strategy {
  return {
    id: strategy.id || Math.random().toString(),
    name: strategy.name || "Demo Strategy",
    status: strategy.status?.toLowerCase() === "active" ? "active" : "inactive",
    lastUpdated: strategy.updatedAt
      ? formatDate(strategy.updatedAt)
      : formatDate(new Date()),
    user_id: strategy.userId || "demo-user",
    description: strategy.description || "Demo strategy description",
    strategyType: strategy.strategyType || "RSI",
    assetClass: strategy.assetClass || "EQUITY",
    symbols: strategy.symbols || ["AAPL", "GOOGL"],
    timeframe: strategy.timeframe || "1D",
    parameters: strategy.parameters || {},
    riskParameters: strategy.riskParameters || {},
    maxPositions: strategy.maxPositions || 5,
    capitalAllocated: strategy.capitalAllocated || 50000,
    totalPnl: strategy.totalPnl || 2500,
    totalTrades: strategy.totalTrades || 150,
    winRate: strategy.winRate || 65.5,
  };
}

// Backend API client with mock implementations
export const backendApi = {
  strategies: {
    // Get all strategies for the current user
    async getAll(): Promise<Strategy[]> {
      try {
        // Mock implementation
        const mockStrategies = [
          {
            id: "1",
            name: "RSI DMI Strategy",
            status: "active",
            userId: "demo-user",
            description: "RSI and DMI based trading strategy",
            strategyType: "RSI_DMI",
            assetClass: "EQUITY",
            symbols: ["AAPL", "MSFT", "GOOGL"],
            timeframe: "1H",
            capitalAllocated: 50000,
            totalPnl: 2500,
            totalTrades: 150,
            winRate: 65.5,
          },
          {
            id: "2",
            name: "Swing Momentum",
            status: "inactive",
            userId: "demo-user",
            description: "Swing trading with momentum indicators",
            strategyType: "SWING",
            assetClass: "EQUITY",
            symbols: ["TSLA", "NVDA"],
            timeframe: "4H",
            capitalAllocated: 30000,
            totalPnl: -500,
            totalTrades: 75,
            winRate: 45.2,
          },
        ];
        return mockStrategies.map(transformStrategy);
      } catch (error) {
        console.error("Error fetching strategies:", error);
        throw new Error(
          "Failed to load strategies. Please check your connection and try again."
        );
      }
    },

    // Update a strategy
    async update(id: string, data: StrategyUpdateRequest): Promise<Strategy> {
      try {
        // Mock implementation
        const mockStrategy = {
          id,
          name: data.name || "Updated Strategy",
          status: data.status || "active",
          userId: "demo-user",
          description: data.description || "Updated description",
          strategyType: "RSI",
          capitalAllocated: 50000,
          updatedAt: new Date(),
        };
        return transformStrategy(mockStrategy);
      } catch (error) {
        console.error("Error updating strategy:", error);
        throw new Error("Failed to update strategy. Please try again.");
      }
    },

    // Square off a specific strategy
    async squareOff(strategyId: string): Promise<SquareOffResponse> {
      try {
        // Mock implementation
        return {
          message: `Strategy ${strategyId} squared off successfully`,
          success: true,
        };
      } catch (error) {
        console.error("Error squaring off strategy:", error);
        throw new Error("Failed to square off strategy. Please try again.");
      }
    },

    // Square off all strategies
    async squareOffAll(): Promise<SquareOffResponse> {
      try {
        // Mock implementation
        return {
          message: "All strategies squared off successfully",
          success: true,
        };
      } catch (error) {
        console.error("Error squaring off all strategies:", error);
        throw new Error(
          "Failed to square off all strategies. Please try again."
        );
      }
    },

    // Initialize default strategies
    async initialize(): Promise<Strategy[]> {
      try {
        // Mock implementation - return default strategies
        return await this.getAll();
      } catch (error) {
        console.error("Error initializing strategies:", error);
        throw new Error("Failed to initialize strategies. Please try again.");
      }
    },

    // Create a new strategy
    async create(strategyData: {
      name: string;
      description?: string;
      strategyType: string;
      status?: "active" | "inactive";
      assetClass?: string;
      symbols?: string[];
      timeframe?: string;
      parameters?: any;
      riskParameters?: any;
      maxPositions?: number;
      capitalAllocated: number;
    }): Promise<Strategy> {
      try {
        // Mock implementation
        const mockStrategy = {
          id: Math.random().toString(),
          ...strategyData,
          userId: "demo-user",
          status: strategyData.status || "inactive",
          totalPnl: 0,
          totalTrades: 0,
          winRate: 0,
          createdAt: new Date(),
        };
        return transformStrategy(mockStrategy);
      } catch (error) {
        console.error("Error creating strategy:", error);
        throw new Error("Failed to create strategy. Please try again.");
      }
    },

    // Delete a strategy
    async delete(strategyId: string): Promise<{ success: boolean }> {
      try {
        // Mock implementation
        return { success: true };
      } catch (error) {
        console.error("Error deleting strategy:", error);
        throw new Error("Failed to delete strategy. Please try again.");
      }
    },

    // Get strategy by ID
    async getById(strategyId: string): Promise<Strategy> {
      try {
        // Mock implementation
        const mockStrategy = {
          id: strategyId,
          name: "Demo Strategy",
          status: "active",
          userId: "demo-user",
          description: "Demo strategy for testing",
          strategyType: "RSI",
          capitalAllocated: 50000,
          totalPnl: 2500,
          totalTrades: 150,
          winRate: 65.5,
        };
        return transformStrategy(mockStrategy);
      } catch (error) {
        console.error("Error fetching strategy:", error);
        throw new Error("Failed to load strategy. Please try again.");
      }
    },

    // Start a strategy
    async start(strategyId: string): Promise<Strategy> {
      try {
        const strategy = await this.getById(strategyId);
        return { ...strategy, status: "active" };
      } catch (error) {
        console.error("Error starting strategy:", error);
        throw new Error("Failed to start strategy. Please try again.");
      }
    },

    // Stop a strategy
    async stop(strategyId: string): Promise<Strategy> {
      try {
        const strategy = await this.getById(strategyId);
        return { ...strategy, status: "inactive" };
      } catch (error) {
        console.error("Error stopping strategy:", error);
        throw new Error("Failed to stop strategy. Please try again.");
      }
    },

    // Pause a strategy
    async pause(strategyId: string): Promise<Strategy> {
      try {
        const strategy = await this.getById(strategyId);
        return { ...strategy, status: "inactive" };
      } catch (error) {
        console.error("Error pausing strategy:", error);
        throw new Error("Failed to pause strategy. Please try again.");
      }
    },
  },
};
