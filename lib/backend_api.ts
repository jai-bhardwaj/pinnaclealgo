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

// Backend API client - now using real pinnacle-backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

export const backendApi = {
  strategies: {
    // Get all strategies from pinnacle-backend
    async getAll(): Promise<Strategy[]> {
      try {
        const strategies = await apiRequest<any[]>("/strategies");
        return strategies.map((strategy) => ({
          id: strategy.id.toString(),
          name: strategy.name,
          status: strategy.enabled ? "active" : "inactive",
          lastUpdated: formatDate(strategy.updated_at),
          user_id: "demo-user", // Default user for now
          description: `${strategy.strategy_type} strategy`,
          strategyType: strategy.strategy_type,
          assetClass: "EQUITY",
          symbols: strategy.symbols || [],
          timeframe: "1D",
          parameters: strategy.parameters || {},
          riskParameters: {},
          maxPositions: 5,
          capitalAllocated: 50000,
          totalPnl: 0,
          totalTrades: 0,
          winRate: 0,
        }));
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
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.description) updateData.description = data.description;
        if (data.status !== undefined)
          updateData.enabled = data.status === "active";

        const strategy = await apiRequest<any>(`/strategies/${id}`, {
          method: "PUT",
          body: JSON.stringify(updateData),
        });

        return {
          id: strategy.id.toString(),
          name: strategy.name,
          status: strategy.enabled ? "active" : "inactive",
          lastUpdated: formatDate(strategy.updated_at),
          user_id: "demo-user",
          description: `${strategy.strategy_type} strategy`,
          strategyType: strategy.strategy_type,
          assetClass: "EQUITY",
          symbols: strategy.symbols || [],
          timeframe: "1D",
          parameters: strategy.parameters || {},
          riskParameters: {},
          maxPositions: 5,
          capitalAllocated: 50000,
          totalPnl: 0,
          totalTrades: 0,
          winRate: 0,
        };
      } catch (error) {
        console.error("Error updating strategy:", error);
        throw new Error("Failed to update strategy. Please try again.");
      }
    },

    // Enable a strategy
    async enable(strategyId: string): Promise<SquareOffResponse> {
      try {
        await apiRequest(`/strategies/${strategyId}/enable`, {
          method: "PUT",
        });
        return {
          message: `Strategy ${strategyId} enabled successfully`,
          success: true,
        };
      } catch (error) {
        console.error("Error enabling strategy:", error);
        throw new Error("Failed to enable strategy. Please try again.");
      }
    },

    // Disable a strategy
    async disable(strategyId: string): Promise<SquareOffResponse> {
      try {
        await apiRequest(`/strategies/${strategyId}/disable`, {
          method: "PUT",
        });
        return {
          message: `Strategy ${strategyId} disabled successfully`,
          success: true,
        };
      } catch (error) {
        console.error("Error disabling strategy:", error);
        throw new Error("Failed to disable strategy. Please try again.");
      }
    },

    // Square off a specific strategy (alias for disable)
    async squareOff(strategyId: string): Promise<SquareOffResponse> {
      return this.disable(strategyId);
    },

    // Square off all strategies
    async squareOffAll(): Promise<SquareOffResponse> {
      try {
        const strategies = await this.getAll();
        const activeStrategies = strategies.filter(
          (s) => s.status === "active"
        );

        for (const strategy of activeStrategies) {
          await this.disable(strategy.id);
        }

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
        const createData = {
          name: strategyData.name,
          strategy_type: strategyData.strategyType,
          symbols: strategyData.symbols || [],
          parameters: strategyData.parameters || {},
          enabled: strategyData.status === "active",
        };

        const strategy = await apiRequest<any>("/strategies", {
          method: "POST",
          body: JSON.stringify(createData),
        });

        return {
          id: strategy.id.toString(),
          name: strategy.name,
          status: strategy.enabled ? "active" : "inactive",
          lastUpdated: formatDate(strategy.updated_at),
          user_id: "demo-user",
          description:
            strategyData.description || `${strategy.strategy_type} strategy`,
          strategyType: strategy.strategy_type,
          assetClass: strategyData.assetClass || "EQUITY",
          symbols: strategy.symbols || [],
          timeframe: strategyData.timeframe || "1D",
          parameters: strategy.parameters || {},
          riskParameters: strategyData.riskParameters || {},
          maxPositions: strategyData.maxPositions || 5,
          capitalAllocated: strategyData.capitalAllocated,
          totalPnl: 0,
          totalTrades: 0,
          winRate: 0,
        };
      } catch (error) {
        console.error("Error creating strategy:", error);
        throw new Error("Failed to create strategy. Please try again.");
      }
    },

    // Delete a strategy
    async delete(strategyId: string): Promise<{ success: boolean }> {
      try {
        await apiRequest(`/strategies/${strategyId}`, {
          method: "DELETE",
        });
        return { success: true };
      } catch (error) {
        console.error("Error deleting strategy:", error);
        throw new Error("Failed to delete strategy. Please try again.");
      }
    },

    // Get strategy by ID
    async getById(strategyId: string): Promise<Strategy> {
      try {
        const strategy = await apiRequest<any>(`/strategies/${strategyId}`);
        return {
          id: strategy.id.toString(),
          name: strategy.name,
          status: strategy.enabled ? "active" : "inactive",
          lastUpdated: formatDate(strategy.updated_at),
          user_id: "demo-user",
          description: `${strategy.strategy_type} strategy`,
          strategyType: strategy.strategy_type,
          assetClass: "EQUITY",
          symbols: strategy.symbols || [],
          timeframe: "1D",
          parameters: strategy.parameters || {},
          riskParameters: {},
          maxPositions: 5,
          capitalAllocated: 50000,
          totalPnl: 0,
          totalTrades: 0,
          winRate: 0,
        };
      } catch (error) {
        console.error("Error fetching strategy:", error);
        throw new Error("Failed to load strategy. Please try again.");
      }
    },

    // Start a strategy (alias for enable)
    async start(strategyId: string): Promise<Strategy> {
      await this.enable(strategyId);
      return this.getById(strategyId);
    },

    // Stop a strategy (alias for disable)
    async stop(strategyId: string): Promise<Strategy> {
      await this.disable(strategyId);
      return this.getById(strategyId);
    },

    // Pause a strategy (alias for disable)
    async pause(strategyId: string): Promise<Strategy> {
      await this.disable(strategyId);
      return this.getById(strategyId);
    },
  },
};
