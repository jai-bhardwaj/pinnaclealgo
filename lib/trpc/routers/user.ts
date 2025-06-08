import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import * as userService from "@/services/user.service";
import { UserRole, UserStatus } from "@prisma/client";

// Input validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).optional().default(UserRole.USER),
  status: z.nativeEnum(UserStatus).optional().default(UserStatus.ACTIVE),
  emailVerified: z.boolean().optional().default(false),
});

const updateUserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  username: z.string().min(3).max(50).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

const paginationSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

const userFiltersSchema = z.object({
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  search: z.string().optional(),
});

const changePasswordSchema = z.object({
  id: z.string(),
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

// New schema for login input
const loginSchema = z.object({
  emailOrUsername: z.string(), // Can be either email or username
  password: z.string(),
});

export const userRouter = createTRPCRouter({
  // Create user
  create: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      try {
        // Transform undefined to null for Prisma compatibility
        const userData = {
          ...input,
          phone: input.phone || null,
          phoneVerified: false,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          lastLoginAt: null,
          loginAttempts: 0,
          lockedUntil: null,
        };
        return await userService.createUser(userData);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Failed to create user",
        });
      }
    }),

  // Get user by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await userService.getUserById(input.id);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      return user;
    }),

  // Get user by email
  getByEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const user = await userService.getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      return user;
    }),

  // Get user by username
  getByUsername: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const user = await userService.getUserByUsername(input.username);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      return user;
    }),

  // Update user
  update: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      try {
        return await userService.updateUser(id, updateData);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Failed to update user",
        });
      }
    }),

  // Delete user
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await userService.deleteUser(input.id);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Failed to delete user",
        });
      }
    }),

  // Get users with pagination and filters
  getAll: protectedProcedure
    .input(
      z.object({
        pagination: paginationSchema.optional(),
        filters: userFiltersSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      return await userService.getUsers(input.pagination, input.filters);
    }),

  // Get user profile
  getProfile: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await userService.getUserProfile(input.userId);
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        timezone: z.string().optional(),
        preferredAssets: z.array(z.string()).optional(),
        notificationSettings: z.record(z.boolean()).optional(),
        tradingPreferences: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, ...profileData } = input;
      try {
        return await userService.updateUserProfile(userId, profileData);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Failed to update profile",
        });
      }
    }),

  // User status management
  activate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await userService.activateUser(input.id);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Failed to activate user",
        });
      }
    }),

  deactivate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await userService.deactivateUser(input.id);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Failed to deactivate user",
        });
      }
    }),

  suspend: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await userService.suspendUser(input.id, input.reason);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Failed to suspend user",
        });
      }
    }),

  changeRole: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        role: z.nativeEnum(UserRole),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await userService.changeUserRole(input.id, input.role);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Failed to change user role",
        });
      }
    }),

  // Password management
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ input }) => {
      // Add your password change logic here using userService
      try {
        await userService.changePassword(
          input.id,
          input.currentPassword,
          input.newPassword
        );
        // If userService.changePassword completes without throwing, it's successful
        return { success: true };
      } catch (error) {
        // Catch any errors thrown by userService.changePassword
        throw new TRPCError({
          code: "BAD_REQUEST", // Use BAD_REQUEST for client-side errors like incorrect password
          message:
            error instanceof Error
              ? error.message
              : "Failed to change password",
        });
      }
    }),

  resetPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      try {
        await userService.resetPassword(input.email);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Failed to reset password",
        });
      }
    }),

  // Email verification
  sendVerificationEmail: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await userService.sendVerificationEmail(input.id);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Failed to send verification email",
        });
      }
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await userService.verifyEmail(input.token);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Failed to verify email",
        });
      }
    }),

  // User statistics
  getStats: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        return await userService.getUserStats(input.id);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Failed to get user stats",
        });
      }
    }),

  // Search users
  search: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        filters: userFiltersSchema.optional(),
      })
    )
    .query(async ({ input }) => {
      return await userService.searchUsers(input.query, input.filters);
    }),

  // Bulk operations
  bulkUpdate: protectedProcedure
    .input(
      z.object({
        userIds: z.array(z.string()),
        updateData: z.object({
          role: z.nativeEnum(UserRole).optional(),
          status: z.nativeEnum(UserStatus).optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await userService.bulkUpdateUsers(
          input.userIds,
          input.updateData
        );
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Failed to bulk update users",
        });
      }
    }),

  bulkDelete: protectedProcedure
    .input(
      z.object({
        userIds: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await userService.bulkDeleteUsers(input.userIds);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Failed to bulk delete users",
        });
      }
    }),

  // Authentication helper
  validateCredentials: publicProcedure
    .input(
      z.object({
        usernameOrEmail: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await userService.validateUserCredentials(
        input.usernameOrEmail,
        input.password
      );

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      return user;
    }),
});
