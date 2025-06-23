import { makeAutoObservable, runInAction } from "mobx";
import { tradingEngineApi } from "@/services/engine-api.service";
import EngineDataAdapter from "@/services/adapters/engine-data-adapter";
import {
  classifyError,
  reportError,
  withRetry,
  type AppError,
  type ErrorContext,
} from "@/stores/utils/errorHandler";
import type { User, StoreState } from "@/types";

export class EngineUserStore implements StoreState {
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  lastError: AppError | null = null;

  // User data
  currentUser: User | null = null;
  isAuthenticated = false;
  accessToken: string | null = null;
  refreshToken: string | null = null;

  // User dashboard data
  dashboardData: any = null;

  constructor() {
    makeAutoObservable(this);

    // Initialize from stored tokens if available
    this.initializeFromStorage();
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setSubmitting(submitting: boolean) {
    this.isSubmitting = submitting;
  }

  setError(error: string | null) {
    this.error = error;
  }

  setAppError(error: AppError | null) {
    this.lastError = error;
    this.error = error?.message || null;
  }

  clearError() {
    this.error = null;
    this.lastError = null;
  }

  private initializeFromStorage() {
    if (typeof window === "undefined") return;

    const hasTokens = tradingEngineApi.initializeFromStorage();
    if (hasTokens) {
      this.isAuthenticated = true;
      this.accessToken = localStorage.getItem("engine_access_token");
      this.refreshToken = localStorage.getItem("engine_refresh_token");

      // Try to get user info from stored data or fetch dashboard
      const storedUser = localStorage.getItem("engine_user_data");
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser);
        } catch (e) {
          console.warn("Failed to parse stored user data");
        }
      }
    }
  }

  // --- Authentication Actions ---

  async login(userId: string, apiKey: string) {
    this.setSubmitting(true);
    this.clearError();

    const context: ErrorContext = {
      action: "login",
      component: "EngineUserStore",
      userId,
    };

    try {
      const result = await withRetry(
        () => tradingEngineApi.login(userId, apiKey),
        {
          maxAttempts: 2,
          onRetry: (attempt, error) => {
            console.log(`Retrying login (attempt ${attempt}):`, error.message);
          },
        }
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || "Login failed");
      }

      runInAction(() => {
        this.isAuthenticated = true;
        this.accessToken = result.data!.access_token;
        this.refreshToken = result.data!.refresh_token;

        // Convert login response to user data
        const userData = EngineDataAdapter.loginResponseToUser(result.data!);
        this.currentUser = {
          id: userData.id!,
          email: userData.email || "",
          username: userData.username!,
          hashedPassword: "", // Not needed on frontend
          firstName: null,
          lastName: null,
          phone: null,
          role: userData.role as any,
          status: userData.status as any,
          emailVerified: userData.emailVerified!,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Store user data locally
        if (typeof window !== "undefined") {
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "engine_user_data",
              JSON.stringify(this.currentUser)
            );
          }
        }
      });

      return result.data;
    } catch (error: unknown) {
      const appError = classifyError(error, context);
      runInAction(() => {
        this.setAppError(appError);
      });
      reportError(appError);
      throw appError;
    } finally {
      runInAction(() => {
        this.setSubmitting(false);
      });
    }
  }

  async logout() {
    this.setSubmitting(true);
    this.clearError();

    try {
      // Attempt to logout from engine
      await tradingEngineApi.logout();
    } catch (error) {
      console.warn(
        "Engine logout failed, continuing with local logout:",
        error
      );
    } finally {
      runInAction(() => {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.dashboardData = null;

        // Clear stored data
        if (typeof window !== "undefined") {
          localStorage.removeItem("engine_user_data");
        }

        this.setSubmitting(false);
      });
    }
  }

  async refreshAccessToken() {
    this.setLoading(true);
    this.clearError();

    try {
      const result = await tradingEngineApi.refreshAccessToken();

      if (!result.success || !result.data) {
        throw new Error(result.error || "Token refresh failed");
      }

      runInAction(() => {
        this.accessToken = result.data!.access_token;
      });

      return result.data;
    } catch (error: unknown) {
      const appError = classifyError(error, {
        action: "refreshToken",
        component: "EngineUserStore",
      });
      runInAction(() => {
        this.setAppError(appError);
        // If refresh fails, logout user
        this.logout();
      });
      throw appError;
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  // --- User Data Actions ---

  async fetchUserDashboard() {
    this.setLoading(true);
    this.clearError();

    const context: ErrorContext = {
      action: "fetchUserDashboard",
      component: "EngineUserStore",
    };

    try {
      const result = await withRetry(
        () => tradingEngineApi.getUserDashboard(),
        {
          maxAttempts: 3,
          onRetry: (attempt, error) => {
            console.log(
              `Retrying fetchUserDashboard (attempt ${attempt}):`,
              error.message
            );
          },
        }
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch user dashboard");
      }

      runInAction(() => {
        this.dashboardData = result.data;

        // Update user info if available
        if (result.data!.user_info && this.currentUser) {
          this.currentUser = {
            ...this.currentUser,
            ...result.data!.user_info,
          };
          localStorage.setItem(
            "engine_user_data",
            JSON.stringify(this.currentUser)
          );
        }
      });

      return result.data;
    } catch (error: unknown) {
      const appError = classifyError(error, context);
      runInAction(() => {
        this.setAppError(appError);
      });
      reportError(appError);
      throw appError;
    } finally {
      runInAction(() => {
        this.setLoading(false);
      });
    }
  }

  // --- Compatibility Methods for UI Components ---

  async fetchCurrentUser() {
    if (!this.isAuthenticated) {
      throw new Error("User not authenticated");
    }

    return this.fetchUserDashboard();
  }

  async updateUser(userData: Partial<User>) {
    this.setSubmitting(true);
    this.clearError();

    try {
      // Engine doesn't support user updates, so we just update locally
      console.log("User update requested (not supported by engine):", userData);

      runInAction(() => {
        if (this.currentUser) {
          this.currentUser = { ...this.currentUser, ...userData };
          localStorage.setItem(
            "engine_user_data",
            JSON.stringify(this.currentUser)
          );
        }
      });

      return this.currentUser;
    } catch (error: unknown) {
      const appError = classifyError(error, {
        action: "updateUser",
        component: "EngineUserStore",
      });
      runInAction(() => {
        this.setAppError(appError);
      });
      throw appError;
    } finally {
      runInAction(() => {
        this.setSubmitting(false);
      });
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    this.setSubmitting(true);
    this.clearError();

    try {
      // Engine doesn't support password changes
      console.log("Password change requested (not supported by engine)");

      runInAction(() => {
        console.log("Password change simulated successfully");
      });

      return { success: true };
    } catch (error: unknown) {
      const appError = classifyError(error, {
        action: "changePassword",
        component: "EngineUserStore",
      });
      runInAction(() => {
        this.setAppError(appError);
      });
      throw appError;
    } finally {
      runInAction(() => {
        this.setSubmitting(false);
      });
    }
  }

  // --- Utility Methods ---

  setCurrentUser(user: User | null) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem("engine_user_data", JSON.stringify(user));
    } else {
      localStorage.removeItem("engine_user_data");
    }
  }

  setAuthenticated(authenticated: boolean) {
    this.isAuthenticated = authenticated;
  }

  setDashboardData(data: any) {
    this.dashboardData = data;
  }

  // --- Getters ---

  get user() {
    return this.currentUser;
  }

  get hasUser() {
    return !!this.currentUser;
  }

  get isLoggedIn() {
    return this.isAuthenticated && !!this.currentUser;
  }

  get userDisplayName() {
    if (!this.currentUser) return "";
    return this.currentUser.firstName && this.currentUser.lastName
      ? `${this.currentUser.firstName} ${this.currentUser.lastName}`
      : this.currentUser.username;
  }

  get userRole() {
    return this.currentUser?.role || "USER";
  }

  get isAdmin() {
    return this.userRole === "ADMIN";
  }

  clear() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.accessToken = null;
    this.refreshToken = null;
    this.dashboardData = null;
    this.clearError();
    localStorage.removeItem("engine_user_data");
  }
}

export default EngineUserStore;
