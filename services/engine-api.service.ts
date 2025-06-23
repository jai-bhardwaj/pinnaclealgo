// Trading Engine API Service
// Bridges the gap between Next.js app and Python trading engine

interface EngineConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface LoginRequest {
  api_key: string;
  user_id: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
  permissions: string[];
}

interface EngineStrategy {
  strategy_id: string;
  name: string;
  description: string;
  category: string;
  risk_level: string;
  min_capital: number;
  expected_return_annual: number;
  max_drawdown: number;
  symbols: string[];
  parameters: Record<string, any>;
  is_active: boolean;
}

interface UserStrategy {
  user_id: string;
  strategy_id: string;
  status: "available" | "active" | "paused";
  activated_at: string;
  allocation_amount: number;
  custom_parameters: Record<string, any>;
  total_orders: number;
  successful_orders: number;
  total_pnl: number;
}

interface EngineOrder {
  order_id: string;
  user_id: string;
  strategy_id?: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  order_type: "MARKET" | "LIMIT";
  price?: number;
  status: "pending" | "placed" | "filled" | "rejected" | "cancelled";
  filled_quantity: number;
  average_price?: number;
  placed_at?: string;
  executed_at?: string;
}

interface EngineSystemStatus {
  engine_running: boolean;
  total_users: number;
  active_strategies: number;
  total_orders: number;
  memory_usage_mb: number;
  uptime_seconds: number;
}

class TradingEngineApiService {
  private config: EngineConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(config: EngineConfig) {
    this.config = {
      timeout: 10000,
      ...config,
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add any additional headers from options
    if (options.headers) {
      const additionalHeaders = options.headers as Record<string, string>;
      Object.assign(headers, additionalHeaders);
    }

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Authentication
  async login(
    userId: string,
    apiKey: string
  ): Promise<ApiResponse<LoginResponse>> {
    const loginData: LoginRequest = {
      api_key: apiKey,
      user_id: userId,
    };

    const result = await this.makeRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(loginData),
    });

    if (result.success && result.data) {
      this.accessToken = result.data.access_token;
      this.refreshToken = result.data.refresh_token;

      // Store tokens in localStorage for persistence (client-side only)
      if (typeof window !== "undefined") {
        localStorage.setItem("engine_access_token", this.accessToken);
        localStorage.setItem("engine_refresh_token", this.refreshToken);
      }
    }

    return result;
  }

  async refreshAccessToken(): Promise<ApiResponse<LoginResponse>> {
    if (!this.refreshToken) {
      return { success: false, error: "No refresh token available" };
    }

    const result = await this.makeRequest<LoginResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });

    if (result.success && result.data) {
      this.accessToken = result.data.access_token;
      if (typeof window !== "undefined") {
        localStorage.setItem("engine_access_token", this.accessToken);
      }
    }

    return result;
  }

  async logout(): Promise<ApiResponse<void>> {
    const result = await this.makeRequest<void>("/auth/logout", {
      method: "POST",
    });

    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("engine_access_token");
      localStorage.removeItem("engine_refresh_token");
    }

    return result;
  }

  // Initialize from stored tokens
  initializeFromStorage(): boolean {
    if (typeof window === "undefined") return false;

    const storedAccessToken = localStorage.getItem("engine_access_token");
    const storedRefreshToken = localStorage.getItem("engine_refresh_token");

    if (storedAccessToken && storedRefreshToken) {
      this.accessToken = storedAccessToken;
      this.refreshToken = storedRefreshToken;
      return true;
    }

    return false;
  }

  // Strategy Management
  async getMarketplace(): Promise<ApiResponse<EngineStrategy[]>> {
    return this.makeRequest<EngineStrategy[]>("/marketplace");
  }

  async getUserDashboard(): Promise<
    ApiResponse<{
      user_info: any;
      active_strategies: UserStrategy[];
      recent_orders: EngineOrder[];
      portfolio_summary: any;
      system_status: any;
    }>
  > {
    return this.makeRequest("/user/dashboard");
  }

  async activateStrategy(
    strategyId: string,
    allocationAmount: number = 0
  ): Promise<ApiResponse<UserStrategy>> {
    return this.makeRequest<UserStrategy>(`/user/activate/${strategyId}`, {
      method: "POST",
      body: JSON.stringify({ allocation_amount: allocationAmount }),
    });
  }

  async deactivateStrategy(
    strategyId: string
  ): Promise<ApiResponse<UserStrategy>> {
    return this.makeRequest<UserStrategy>(`/user/deactivate/${strategyId}`, {
      method: "POST",
    });
  }

  // System Information
  async getSystemStatus(): Promise<ApiResponse<EngineSystemStatus>> {
    return this.makeRequest<EngineSystemStatus>("/system/status");
  }

  async getHealthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.makeRequest<{ status: string }>("/health");
  }

  // Market Data
  async getMarketData(): Promise<ApiResponse<any>> {
    return this.makeRequest("/market-data");
  }

  // Orders (if the engine provides order endpoints)
  async getOrders(): Promise<ApiResponse<EngineOrder[]>> {
    return this.makeRequest<EngineOrder[]>("/orders");
  }

  // Strategy Statistics
  async getStrategies(): Promise<ApiResponse<any>> {
    return this.makeRequest("/strategies");
  }

  async getBrokerStats(): Promise<ApiResponse<any>> {
    return this.makeRequest("/broker");
  }

  // Administrative functions
  async getMemoryStatus(): Promise<ApiResponse<any>> {
    return this.makeRequest("/admin/memory/status");
  }

  async cleanupMemory(): Promise<ApiResponse<any>> {
    return this.makeRequest("/admin/memory/cleanup", { method: "POST" });
  }
}

// Create singleton instance
const engineConfig: EngineConfig = {
  baseUrl: process.env.NEXT_PUBLIC_ENGINE_API_URL || "http://localhost:8000",
  timeout: 10000,
};

export const tradingEngineApi = new TradingEngineApiService(engineConfig);

// Export types
export type {
  EngineConfig,
  ApiResponse,
  LoginRequest,
  LoginResponse,
  EngineStrategy,
  UserStrategy,
  EngineOrder,
  EngineSystemStatus,
};

export { TradingEngineApiService };
