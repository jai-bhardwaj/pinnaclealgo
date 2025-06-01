export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  context?: Record<string, unknown>;
  timestamp?: Date;
}

export interface ErrorContext {
  userId?: string;
  action?: string;
  component?: string;
  [key: string]: unknown;
}

export function createAppError(
  message: string,
  options?: Partial<AppError>
): AppError {
  return {
    message,
    code: options?.code || "UNKNOWN_ERROR",
    statusCode: options?.statusCode || 500,
    context: options?.context || {},
    timestamp: new Date(),
  };
}

export function createNetworkError(
  message: string,
  statusCode?: number,
  context?: ErrorContext
): AppError {
  return createAppError(message, {
    code: "NETWORK_ERROR",
    statusCode,
    context,
  });
}

export function createValidationError(
  message: string,
  context?: ErrorContext
): AppError {
  return createAppError(message, {
    code: "VALIDATION_ERROR",
    statusCode: 400,
    context,
  });
}

export function createAuthError(
  message: string = "Authentication failed",
  context?: ErrorContext
): AppError {
  return createAppError(message, {
    code: "AUTH_ERROR",
    statusCode: 401,
    context,
  });
}

export function createNotFoundError(
  resource: string,
  context?: ErrorContext
): AppError {
  return createAppError(`${resource} not found`, {
    code: "NOT_FOUND_ERROR",
    statusCode: 404,
    context,
  });
}

export function createServerError(
  message: string = "Internal server error",
  context?: ErrorContext
): AppError {
  return createAppError(message, {
    code: "SERVER_ERROR",
    statusCode: 500,
    context,
  });
}

// Error classification helper
export function classifyError(
  error: unknown,
  context?: ErrorContext
): AppError {
  if (error instanceof Error) {
    // Network/fetch errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      return createNetworkError(
        "Network connection failed",
        undefined,
        context
      );
    }

    // Timeout errors
    if (error.message.includes("timeout")) {
      return createNetworkError("Request timeout", 408, context);
    }

    // Generic error
    return createAppError(error.message, {
      code: "GENERIC_ERROR",
      context: { ...context, originalError: error.name },
    });
  }

  // HTTP response errors
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = (error as any).status;
    const message = (error as any).message || "HTTP Error";

    if (status === 401) {
      return createAuthError(message, context);
    }
    if (status === 404) {
      return createNotFoundError(message, context);
    }
    if (status >= 500) {
      return createServerError(message, context);
    }

    return createNetworkError(message, status, context);
  }

  // Unknown error
  return createAppError("An unknown error occurred", {
    code: "UNKNOWN_ERROR",
    context: { ...context, originalError: String(error) },
  });
}

// Error reporting
export function reportError(error: AppError): void {
  // In development, just log to console
  if (process.env.NODE_ENV === "development") {
    console.group("🚨 Error Report");
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Status:", error.statusCode);
    console.error("Context:", error.context);
    console.error("Timestamp:", error.timestamp);
    console.groupEnd();
    return;
  }

  // In production, send to monitoring service
  try {
    // TODO: Integrate with Sentry or other monitoring service
    // Sentry.captureException(new Error(error.message), {
    //   tags: {
    //     errorCode: error.code,
    //     statusCode: error.statusCode?.toString(),
    //   },
    //   extra: error.context,
    // });

    console.error("Error reported:", error.code, error.message);
  } catch (reportingError) {
    console.error("Failed to report error:", reportingError);
  }
}

// Retry logic helper
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
    onRetry?: (attempt: number, error: AppError) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = true, onRetry } = options;

  let lastError: AppError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = classifyError(error, { attempt });

      if (attempt === maxAttempts) {
        reportError(lastError);
        throw lastError;
      }

      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Calculate delay with optional backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }
  }

  throw lastError!;
}
