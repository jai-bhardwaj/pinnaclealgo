import { env } from "@/lib/env";

export const config = {
  app: {
    name: "Pinnacle Trading",
    version: env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    environment: env.NODE_ENV,
  },
  api: {
    timeout: 30000,
    retries: 3,
    baseUrl: env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  },
  features: {
    enableAnalytics: env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
    enableErrorReporting: env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === "true",
    enableDebugMode: env.NODE_ENV === "development",
  },
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
    strategies: {
      defaultPageSize: 20,
      maxPageSize: 50,
    },
    orders: {
      defaultPageSize: 15,
      maxPageSize: 100,
    },
  },
  auth: {
    sessionTimeout: 24 * 60 * 60, // 24 hours in seconds
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60, // 15 minutes in seconds
  },
  ui: {
    defaultTheme: "light",
    animationDuration: 200,
    toast: {
      defaultDuration: 5000,
      errorDuration: 8000,
      successDuration: 3000,
    },
    table: {
      defaultSortField: "createdAt",
      defaultSortDirection: "desc" as const,
    },
  },
  trading: {
    refreshInterval: 30000, // 30 seconds
    maxPositions: 50,
    defaultRiskLevel: "medium" as const,
    supportedAssets: [
      "EQUITY",
      "FUTURES",
      "OPTIONS",
      "CURRENCY",
      "COMMODITIES",
      "CRYPTO",
    ] as const,
    statusColors: {
      ACTIVE: "green",
      INACTIVE: "gray",
      PAUSED: "yellow",
      ERROR: "red",
    } as const,
  },
  monitoring: {
    enablePerformanceTracking: env.NODE_ENV === "production",
    enableErrorTracking: env.NODE_ENV === "production",
    sentryDsn: env.NEXT_PUBLIC_SENTRY_DSN,
  },
} as const;

// Type helpers
export type Config = typeof config;
export type AssetType = (typeof config.trading.supportedAssets)[number];
export type StatusColor = keyof typeof config.trading.statusColors;
export type Theme = typeof config.ui.defaultTheme;

// Helper functions
export function getAssetColor(asset: AssetType): string {
  const colorMap: Record<AssetType, string> = {
    EQUITY: "blue",
    FUTURES: "purple",
    OPTIONS: "orange",
    CURRENCY: "green",
    COMMODITIES: "yellow",
    CRYPTO: "indigo",
  };
  return colorMap[asset] || "gray";
}

export function getStatusColor(status: string): string {
  return config.trading.statusColors[status as StatusColor] || "gray";
}

export function isFeatureEnabled(
  feature: keyof typeof config.features
): boolean {
  return config.features[feature];
}

export function getApiUrl(endpoint?: string): string {
  const baseUrl = config.api.baseUrl;
  return endpoint
    ? `${baseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`
    : baseUrl;
}
