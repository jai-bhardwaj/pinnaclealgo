import { prisma } from "./prisma";
import { User, UserProfile, UserRole, UserStatus } from "@prisma/client";
import { PaginationParams, FilterParams } from "./types";
import bcrypt from "bcryptjs";

// Use Prisma generated types for consistency
type UserWithRelations = User & {
  profile?: UserProfile | null;
  riskProfile?: any | null;
  balance?: any | null;
  brokerConfigs?: any[];
  _count?: any;
};

// Custom create user data type to include password
type CreateUserData = Omit<
  User,
  "id" | "createdAt" | "updatedAt" | "hashedPassword"
> & {
  password: string;
};

type UpdateUserData = Partial<
  Omit<User, "id" | "createdAt" | "updatedAt" | "hashedPassword">
>;

// User CRUD operations
export const createUser = async (
  userData: CreateUserData
): Promise<UserWithRelations> => {
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  return prisma.user.create({
    data: {
      ...userData,
      hashedPassword,
      // Create default profile
      profile: {
        create: {
          timezone: "UTC",
          preferredAssets: [],
        },
      },
      // Create default risk profile
      riskProfile: {
        create: {
          riskLevel: "MODERATE",
          maxDailyLossPct: 0.02,
          maxWeeklyLossPct: 0.05,
          maxMonthlyLossPct: 0.1,
          maxPositionSizePct: 0.1,
          maxOrderValue: 50000,
          maxOrdersPerMinute: 10,
          maxExposurePerSymbol: 0.05,
          stopLossEnabled: true,
          defaultStopLossPct: 0.02,
          takeProfitEnabled: true,
          defaultTakeProfitPct: 0.04,
          allowedAssetClasses: ["EQUITY"],
          allowedExchanges: ["NSE", "BSE"],
          tradingHoursOnly: true,
        },
      },
      // Create default balance
      balance: {
        create: {
          availableCash: 0,
          usedMargin: 0,
          totalBalance: 0,
          portfolioValue: 0,
          totalPnl: 0,
          dayPnl: 0,
          buyingPower: 0,
          marginUsed: 0,
          marginAvailable: 0,
          lastUpdated: new Date(),
        },
      },
    },
    include: {
      profile: true,
      riskProfile: true,
      balance: true,
    },
  });
};

export const getUserById = async (
  id: string
): Promise<UserWithRelations | null> => {
  return prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      riskProfile: true,
      balance: true,
      brokerConfigs: true,
      _count: {
        select: {
          strategies: true,
          orders: true,
          trades: true,
          positions: true,
        },
      },
    },
  });
};

export const getUserByEmail = async (
  email: string
): Promise<UserWithRelations | null> => {
  return prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
      riskProfile: true,
      balance: true,
    },
  });
};

export const getUserByUsername = async (
  username: string
): Promise<UserWithRelations | null> => {
  return prisma.user.findUnique({
    where: { username },
    include: {
      profile: true,
      riskProfile: true,
      balance: true,
    },
  });
};

export const updateUser = async (
  id: string,
  userData: UpdateUserData
): Promise<UserWithRelations> => {
  return prisma.user.update({
    where: { id },
    data: userData,
    include: {
      profile: true,
      riskProfile: true,
      balance: true,
    },
  });
};

export const deleteUser = async (id: string): Promise<void> => {
  await prisma.user.delete({
    where: { id },
  });
};

export const getUsers = async (
  pagination?: PaginationParams,
  filters?: FilterParams
) => {
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters?.role) where.role = filters.role;
  if (filters?.status) where.status = filters.status;
  if (filters?.search) {
    where.OR = [
      { email: { contains: filters.search, mode: "insensitive" } },
      { username: { contains: filters.search, mode: "insensitive" } },
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: pagination?.sortBy
        ? {
            [pagination.sortBy]: pagination.sortOrder || "asc",
          }
        : { createdAt: "desc" },
      include: {
        profile: true,
        _count: {
          select: {
            strategies: true,
            orders: true,
            trades: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// User Profile operations
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  return prisma.userProfile.findUnique({
    where: { userId },
  });
};

export const updateUserProfile = async (
  userId: string,
  profileData: Partial<
    Omit<UserProfile, "id" | "userId" | "createdAt" | "updatedAt">
  >
): Promise<UserProfile> => {
  return prisma.userProfile.upsert({
    where: { userId },
    update: profileData,
    create: {
      userId,
      timezone: "UTC",
      preferredAssets: [],
      ...profileData,
    },
  });
};

// User status management
export const activateUser = async (id: string): Promise<UserWithRelations> => {
  return prisma.user.update({
    where: { id },
    data: { status: UserStatus.ACTIVE },
    include: {
      profile: true,
      riskProfile: true,
      balance: true,
    },
  });
};

export const deactivateUser = async (
  id: string
): Promise<UserWithRelations> => {
  return prisma.user.update({
    where: { id },
    data: { status: UserStatus.INACTIVE },
    include: {
      profile: true,
      riskProfile: true,
      balance: true,
    },
  });
};

export const suspendUser = async (
  id: string,
  reason?: string
): Promise<UserWithRelations> => {
  return prisma.user.update({
    where: { id },
    data: {
      status: UserStatus.SUSPENDED,
      // You might want to store the reason in a separate audit log
    },
    include: {
      profile: true,
      riskProfile: true,
      balance: true,
    },
  });
};

export const changeUserRole = async (
  id: string,
  role: UserRole
): Promise<UserWithRelations> => {
  return prisma.user.update({
    where: { id },
    data: { role },
    include: {
      profile: true,
      riskProfile: true,
      balance: true,
    },
  });
};

// Password management
export const changePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { hashedPassword: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isValidPassword = await bcrypt.compare(
    currentPassword,
    user.hashedPassword
  );
  if (!isValidPassword) {
    throw new Error("Current password is incorrect");
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id },
    data: { hashedPassword: hashedNewPassword },
  });
};

export const resetPassword = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Generate reset token and save it
  // This would typically involve sending an email
  // Implementation depends on your email service
  console.log(`Password reset requested for ${email}`);
};

// Email verification
export const sendVerificationEmail = async (id: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Send verification email
  console.log(`Verification email sent to ${user.email}`);
};

export const verifyEmail = async (
  token: string
): Promise<UserWithRelations> => {
  // Verify token and get user ID
  // This is a simplified implementation
  const userId = "user-id-from-token";

  return prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
    include: {
      profile: true,
      riskProfile: true,
      balance: true,
    },
  });
};

// User statistics
export const getUserStats = async (id: string) => {
  const [user, orderCount, tradeCount, strategyCount, balance] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: { createdAt: true },
      }),
      prisma.order.count({ where: { userId: id } }),
      prisma.trade.count({ where: { userId: id } }),
      prisma.strategy.count({ where: { userId: id, status: "ACTIVE" } }),
      prisma.balance.findUnique({ where: { userId: id } }),
    ]);

  if (!user) {
    throw new Error("User not found");
  }

  return {
    totalOrders: orderCount,
    totalTrades: tradeCount,
    totalPnl: balance?.totalPnl || 0,
    activeStrategies: strategyCount,
    portfolioValue: balance?.portfolioValue || 0,
    joinedDate: user.createdAt,
  };
};

// Search users
export const searchUsers = async (
  query: string,
  filters?: FilterParams
): Promise<UserWithRelations[]> => {
  const where: any = {
    OR: [
      { email: { contains: query, mode: "insensitive" } },
      { username: { contains: query, mode: "insensitive" } },
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
    ],
  };

  if (filters?.role) where.role = filters.role;
  if (filters?.status) where.status = filters.status;

  return prisma.user.findMany({
    where,
    take: 20, // Limit search results
    include: {
      profile: true,
      _count: {
        select: {
          strategies: true,
          orders: true,
        },
      },
    },
  });
};

// Bulk operations
export const bulkUpdateUsers = async (
  userIds: string[],
  updateData: Partial<UpdateUserData>
): Promise<{ count: number }> => {
  return prisma.user.updateMany({
    where: {
      id: { in: userIds },
    },
    data: updateData,
  });
};

export const bulkDeleteUsers = async (
  userIds: string[]
): Promise<{ count: number }> => {
  return prisma.user.deleteMany({
    where: {
      id: { in: userIds },
    },
  });
};

// Authentication helpers
export const validateUserCredentials = async (
  usernameOrEmail: string,
  password: string
): Promise<UserWithRelations | null> => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
    },
    include: {
      profile: true,
      riskProfile: true,
      balance: true,
    },
  });

  if (!user) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
  if (!isValidPassword) {
    return null;
  }

  return user;
};
