// Service types based on Prisma schema

// Enums
export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
    PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export enum BrokerName {
    ANGEL_ONE = 'ANGEL_ONE',
    ZERODHA = 'ZERODHA',
    UPSTOX = 'UPSTOX',
    FYERS = 'FYERS',
    ALICE_BLUE = 'ALICE_BLUE'
}

export enum RiskLevel {
    CONSERVATIVE = 'CONSERVATIVE',
    MODERATE = 'MODERATE',
    AGGRESSIVE = 'AGGRESSIVE',
    CUSTOM = 'CUSTOM'
}

export enum StrategyStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    STOPPED = 'STOPPED',
    ERROR = 'ERROR',
    BACKTESTING = 'BACKTESTING'
}

export enum AssetClass {
    EQUITY = 'EQUITY',
    DERIVATIVES = 'DERIVATIVES',
    CRYPTO = 'CRYPTO',
    COMMODITIES = 'COMMODITIES',
    FOREX = 'FOREX'
}

export enum TimeFrame {
    SECOND_1 = 'SECOND_1',
    SECOND_5 = 'SECOND_5',
    SECOND_15 = 'SECOND_15',
    SECOND_30 = 'SECOND_30',
    MINUTE_1 = 'MINUTE_1',
    MINUTE_3 = 'MINUTE_3',
    MINUTE_5 = 'MINUTE_5',
    MINUTE_15 = 'MINUTE_15',
    MINUTE_30 = 'MINUTE_30',
    HOUR_1 = 'HOUR_1',
    HOUR_4 = 'HOUR_4',
    DAY_1 = 'DAY_1',
    WEEK_1 = 'WEEK_1',
    MONTH_1 = 'MONTH_1'
}

export enum OrderSide {
    BUY = 'BUY',
    SELL = 'SELL'
}

export enum OrderType {
    MARKET = 'MARKET',
    LIMIT = 'LIMIT',
    SL = 'SL',
    SL_M = 'SL_M'
}

export enum ProductType {
    DELIVERY = 'DELIVERY',
    INTRADAY = 'INTRADAY',
    MARGIN = 'MARGIN',
    NORMAL = 'NORMAL',
    CARRYFORWARD = 'CARRYFORWARD',
    BO = 'BO',
    CO = 'CO'
}

export enum OrderStatus {
    PENDING = 'PENDING',
    PLACED = 'PLACED',
    OPEN = 'OPEN',
    COMPLETE = 'COMPLETE',
    CANCELLED = 'CANCELLED',
    REJECTED = 'REJECTED',
    ERROR = 'ERROR',
    UNKNOWN = 'UNKNOWN'
}

export enum NotificationType {
    ORDER_EXECUTED = 'ORDER_EXECUTED',
    ORDER_CANCELLED = 'ORDER_CANCELLED',
    STRATEGY_STARTED = 'STRATEGY_STARTED',
    STRATEGY_STOPPED = 'STRATEGY_STOPPED',
    RISK_VIOLATION = 'RISK_VIOLATION',
    SYSTEM_ALERT = 'SYSTEM_ALERT',
    PRICE_ALERT = 'PRICE_ALERT'
}

export enum NotificationStatus {
    UNREAD = 'UNREAD',
    READ = 'READ',
    ARCHIVED = 'ARCHIVED'
}

export enum AuditAction {
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    ORDER_PLACED = 'ORDER_PLACED',
    ORDER_CANCELLED = 'ORDER_CANCELLED',
    STRATEGY_CREATED = 'STRATEGY_CREATED',
    STRATEGY_UPDATED = 'STRATEGY_UPDATED',
    STRATEGY_STARTED = 'STRATEGY_STARTED',
    STRATEGY_STOPPED = 'STRATEGY_STOPPED',
    SETTINGS_CHANGED = 'SETTINGS_CHANGED',
    PASSWORD_CHANGED = 'PASSWORD_CHANGED',
    API_KEY_CREATED = 'API_KEY_CREATED',
    API_KEY_DELETED = 'API_KEY_DELETED'
}

// Base interfaces
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt?: Date;
}

// User related types
export interface User extends BaseEntity {
    email: string;
    username: string;
    hashedPassword: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    lastLoginAt?: Date;
    loginAttempts: number;
    lockedUntil?: Date;
}

export interface UserProfile extends BaseEntity {
    userId: string;
    avatar?: string;
    bio?: string;
    timezone: string;
    language: string;
    tradingExperience?: string;
    riskTolerance?: string;
    investmentGoals?: string;
    preferredAssets: string[];
}

export interface UserSession {
    id: string;
    userId: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
    createdAt: Date;
}

export interface ApiKey extends BaseEntity {
    userId: string;
    name: string;
    keyHash: string;
    permissions: string[];
    lastUsedAt?: Date;
    expiresAt?: Date;
    isActive: boolean;
}

// Broker related types
export interface BrokerConfig extends BaseEntity {
    userId: string;
    brokerName: BrokerName;
    displayName?: string;
    apiKey: string;
    clientId: string;
    password: string;
    totpSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    isActive: boolean;
    isConnected: boolean;
    lastSyncAt?: Date;
}

// Risk management types
export interface RiskProfile extends BaseEntity {
    userId: string;
    riskLevel: RiskLevel;
    maxDailyLossPct: number;
    maxWeeklyLossPct: number;
    maxMonthlyLossPct: number;
    maxPositionSizePct: number;
    maxOrderValue: number;
    maxOrdersPerMinute: number;
    maxExposurePerSymbol: number;
    stopLossEnabled: boolean;
    defaultStopLossPct: number;
    takeProfitEnabled: boolean;
    defaultTakeProfitPct: number;
    allowedAssetClasses: string[];
    allowedExchanges: string[];
    tradingHoursOnly: boolean;
}

// Strategy related types
export interface Strategy extends BaseEntity {
    userId: string;
    name: string;
    description?: string;
    strategyType: string;
    assetClass: AssetClass;
    symbols: string[];
    timeframe: TimeFrame;
    status: StrategyStatus;
    parameters: any;
    riskParameters: any;
    totalPnl: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    sharpeRatio?: number;
    maxDrawdown: number;
    isLive: boolean;
    isPaperTrading: boolean;
    maxPositions: number;
    capitalAllocated: number;
    startTime?: string;
    endTime?: string;
    activeDays: string[];
    version: number;
    lastExecutedAt?: Date;
    nextExecutionAt?: Date;
}

export interface Backtest extends BaseEntity {
    strategyId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    finalCapital: number;
    totalReturn: number;
    annualReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalTrades: number;
    winRate: number;
    trades: any;
    metrics: any;
    status: string;
    completedAt?: Date;
}

export interface StrategyLog {
    id: string;
    strategyId: string;
    level: string;
    message: string;
    data?: any;
    timestamp: Date;
}

// Order and Trade types
export interface Order extends BaseEntity {
    userId: string;
    strategyId?: string;
    symbol: string;
    exchange: string;
    side: OrderSide;
    orderType: OrderType;
    productType: ProductType;
    quantity: number;
    price?: number;
    triggerPrice?: number;
    variety: string;
    brokerOrderId?: string;
    status: OrderStatus;
    statusMessage?: string;
    filledQuantity: number;
    averagePrice?: number;
    isPaperTrade: boolean;
    parentOrderId?: string;
    tags: string[];
    notes?: string;
    placedAt?: Date;
    executedAt?: Date;
    cancelledAt?: Date;
}

export interface Trade extends BaseEntity {
    userId: string;
    orderId: string;
    tradeId?: string;
    symbol: string;
    exchange: string;
    side: OrderSide;
    quantity: number;
    price: number;
    productType: ProductType;
    orderType: OrderType;
    brokerage: number;
    taxes: number;
    totalCharges: number;
    netAmount: number;
    tradeTimestamp?: Date;
}

// Portfolio types
export interface Position extends BaseEntity {
    userId: string;
    symbol: string;
    exchange: string;
    productType: ProductType;
    quantity: number;
    averagePrice: number;
    lastTradedPrice: number;
    pnl: number;
    realizedPnl: number;
    marketValue: number;
    dayChange: number;
    dayChangePct: number;
    firstBuyDate?: Date;
    lastTradeDate?: Date;
}

export interface Balance extends BaseEntity {
    userId: string;
    availableCash: number;
    usedMargin: number;
    totalBalance: number;
    portfolioValue: number;
    totalPnl: number;
    dayPnl: number;
    buyingPower: number;
    marginUsed: number;
    marginAvailable: number;
    lastUpdated: Date;
}

// Market data types
export interface Watchlist extends BaseEntity {
    userId: string;
    name: string;
    description?: string;
    symbols: string[];
    isDefault: boolean;
}

export interface MarketData extends BaseEntity {
    symbol: string;
    exchange: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    previousClose?: number;
    change?: number;
    changePct?: number;
    timestamp: Date;
    timeframe: TimeFrame;
}

// Notification types
export interface Notification extends BaseEntity {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    status: NotificationStatus;
    readAt?: Date;
}

export interface Alert extends BaseEntity {
    userId: string;
    symbol: string;
    exchange: string;
    condition: string;
    targetPrice: number;
    isActive: boolean;
    isTriggered: boolean;
    triggeredAt?: Date;
}

// Audit types
export interface AuditLog {
    id: string;
    userId?: string;
    action: AuditAction;
    resource?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

// System types
export interface SystemConfig extends BaseEntity {
    key: string;
    value: string;
    description?: string;
    isPublic: boolean;
}

// Service response types
export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Request types
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
    [key: string]: any;
}

// Create/Update types
export type CreateUserData = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'hashedPassword'> & {
    password: string;
};

export type UpdateUserData = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'hashedPassword'>>;

export type CreateStrategyData = Omit<Strategy, 'id' | 'createdAt' | 'updatedAt' | 'totalPnl' | 'totalTrades' | 'winningTrades' | 'losingTrades' | 'winRate' | 'maxDrawdown'>;

export type UpdateStrategyData = Partial<Omit<Strategy, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>;

export type CreateOrderData = Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'filledQuantity' | 'brokerOrderId' | 'statusMessage' | 'averagePrice' | 'placedAt' | 'executedAt' | 'cancelledAt'>;

export type UpdateOrderData = Partial<Pick<Order, 'status' | 'statusMessage' | 'filledQuantity' | 'averagePrice' | 'brokerOrderId' | 'executedAt' | 'cancelledAt'>>;

export type CreateTradeData = Omit<Trade, 'id' | 'createdAt'>;

export type CreatePositionData = Omit<Position, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdatePositionData = Partial<Omit<Position, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'symbol' | 'exchange' | 'productType'>>;

export type CreateWatchlistData = Omit<Watchlist, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateWatchlistData = Partial<Omit<Watchlist, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>;

export type CreateNotificationData = Omit<Notification, 'id' | 'createdAt' | 'status' | 'readAt'>;

export type CreateAlertData = Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'isTriggered' | 'triggeredAt'>;

export type UpdateAlertData = Partial<Omit<Alert, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>;

export type CreateBrokerConfigData = Omit<BrokerConfig, 'id' | 'createdAt' | 'updatedAt' | 'isConnected' | 'lastSyncAt'>;

export type UpdateBrokerConfigData = Partial<Omit<BrokerConfig, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'brokerName'>>;

export type CreateRiskProfileData = Omit<RiskProfile, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateRiskProfileData = Partial<Omit<RiskProfile, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>;

export type CreateBacktestData = Omit<Backtest, 'id' | 'createdAt' | 'completedAt' | 'finalCapital' | 'totalReturn' | 'annualReturn' | 'sharpeRatio' | 'maxDrawdown' | 'totalTrades' | 'winRate' | 'trades' | 'metrics'>;

export type CreateAuditLogData = Omit<AuditLog, 'id' | 'timestamp'>;

export type CreateSystemConfigData = Omit<SystemConfig, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateSystemConfigData = Partial<Omit<SystemConfig, 'id' | 'createdAt' | 'updatedAt' | 'key'>>; 