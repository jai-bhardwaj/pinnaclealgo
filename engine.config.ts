// Trading Engine Configuration
// Configuration for connecting to the FastAPI trading backend

interface EngineConfig {
  BASE_URL: string;
  WS_URL: string;
  FEATURES: {
    DEBUG_MODE: boolean;
    AUTO_LOGIN: boolean;
    ENABLE_WEBSOCKET: boolean;
  };
  AUTH: {
    TOKEN_STORAGE_KEY: string;
    REFRESH_TOKEN_KEY: string;
    AUTO_REFRESH: boolean;
  };
  API: {
    TIMEOUT: number;
    MAX_RETRIES: number;
    RETRY_DELAY: number;
  };
}

export const ENGINE_CONFIG: EngineConfig = {
  BASE_URL: process.env.NEXT_PUBLIC_ENGINE_API_URL || "http://localhost:8000",
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws",
  FEATURES: {
    DEBUG_MODE: process.env.NODE_ENV === "development",
    AUTO_LOGIN: process.env.NODE_ENV === "development",
    ENABLE_WEBSOCKET: true,
  },
  AUTH: {
    TOKEN_STORAGE_KEY: "engine_access_token",
    REFRESH_TOKEN_KEY: "engine_refresh_token",
    AUTO_REFRESH: true,
  },
  API: {
    TIMEOUT: 10000, // 10 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
  },
};

interface DefaultCredentials {
  userId?: string;
  apiKey?: string;
}

// Get default credentials for development/testing
export function getDefaultCredentials(): DefaultCredentials | null {
  // Only provide default credentials in development mode
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // Check for environment variables first
  const envUserId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID;
  const envApiKey = process.env.NEXT_PUBLIC_DEFAULT_API_KEY;

  if (envUserId && envApiKey) {
    return {
      userId: envUserId,
      apiKey: envApiKey,
    };
  }

  // Fallback to demo credentials for development
  return {
    userId: "demo_user",
    apiKey: "demo_api_key_12345",
  };
}

// Utility functions for configuration
export function isDebugMode(): boolean {
  return ENGINE_CONFIG.FEATURES.DEBUG_MODE;
}

export function isAutoLoginEnabled(): boolean {
  return ENGINE_CONFIG.FEATURES.AUTO_LOGIN;
}

export function getEngineBaseUrl(): string {
  return ENGINE_CONFIG.BASE_URL;
}

export function getWebSocketUrl(): string {
  return ENGINE_CONFIG.WS_URL;
}

export default ENGINE_CONFIG; 