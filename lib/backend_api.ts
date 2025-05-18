import { getSession } from "next-auth/react";

// Use server IP address instead of localhost to avoid connection issues
const API_BASE_URL = "http://165.22.223.223:8000";

interface ApiError extends Error {
  status?: number;
  data?: any;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface UserResponse {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Strategy {
  id: string;
  name: string;
  margin: number;
  marginType: "percentage" | "rupees";
  basePrice: number;
  status: "active" | "inactive";
  lastUpdated: string;
  user_id: string;
}

interface Order {
  broker_order_id: string;
  internal_order_id?: string;
  status: string;
  message?: string;
  broker: string;
  symbol: string;
  side: string;
  quantity: number;
  filled_quantity?: number;
  pending_quantity?: number;
  average_price?: number;
  order_type: string;
  product_type: string;
  trigger_price?: number;
  price: number;
  order_timestamp?: string;
}

interface OrderResponse {
  broker_order_id: string;
  status: string;
  message?: string;
}

async function getAuthHeaders() {
  const session = await getSession();
  if (!session?.user?.access_token) {
    throw new Error("No access token found");
  }
  return {
    "Authorization": `Bearer ${session.user.access_token}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    let errorMessage = response.statusText;

    if (errorData) {
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map((err: any) => err.msg).join(', ');
      }
    }

    // Handle token expiration
    if (response.status === 401 && errorMessage.includes('Token has expired')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        window.location.href = '/login';  // Redirect to login page
      }
      throw new Error('Session expired. Please log in again.');
    }

    const error = new Error(errorMessage) as ApiError;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return response.json();
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2, timeout = 15000) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If it's a retry, let the user know
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${maxRetries} for ${url}...`);
      }

      // Use fetchWithTimeout for the actual fetch with timeout
      return await fetchWithTimeout(url, options, timeout);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      if (error instanceof Error) {
        // Don't retry on 401/403/404 errors
        if (error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('404')) {
          throw error;
        }
      }

      // If we've used all retries, throw the last error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait a bit before retrying (exponential backoff)
      const delay = Math.min(500 * Math.pow(2, attempt), 3000);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached because of the throw in the loop
  throw lastError || new Error('Unknown error during fetch with retry');
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    console.log(`Attempting to fetch ${url}...`);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    console.error("Fetch error details:", {
      url,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error(`Request to ${url} timed out after ${timeout}ms`);
      }

      // Check for connection refused errors (IPv6 issues)
      if (error.message.includes('ECONNREFUSED') && url.includes('localhost')) {
        console.error('IPv6 connection refused, try using 127.0.0.1 instead of localhost');
        throw new Error('Connection refused. Please check server connectivity.');
      }

      if (error.name === "TypeError" && error.message.includes('Failed to fetch')) {
        throw new Error(`Network error - Could not connect to ${url}. Please check if the server is running and accessible.`);
      }
    }
    throw error;
  }
}

const backendApi = {
  // Auth endpoints
  auth: {
    login: async (username: string, password: string): Promise<LoginResponse> => {
      try {
        // Create form data for the request
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        console.log(`Attempting login for user: ${username}`);

        // Make the request with proper error handling
        const response = await fetchWithRetry(`${API_BASE_URL}/auth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
          // Ensure no caching for auth requests
          cache: 'no-store',
        });

        const data = await handleResponse(response);

        if (!data.access_token) {
          console.error('No access token in response:', data);
          throw new Error('Invalid login response: No access token received');
        }

        return data;
      } catch (error) {
        console.error('Login error:', error);

        // Format the error message for user display
        if (error instanceof Error) {
          if (error.message.includes('Connection refused')) {
            throw new Error('Could not connect to the authentication server. Please try again later.');
          }

          if (error.message.includes('Incorrect username/email or password')) {
            throw new Error('Incorrect username/email or password');
          }

          throw error;
        }

        throw new Error('An unexpected error occurred during login');
      }
    },

    register: async (username: string, email: string, password: string): Promise<UserResponse> => {
      const response = await fetchWithRetry(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });
      return handleResponse(response);
    },

    getProfile: async (): Promise<UserResponse> => {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(`${API_BASE_URL}/users/me`, {
        method: "GET",
        headers,
      });
      return handleResponse(response);
    },

    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
      }
    },
  },

  // Strategy endpoints
  strategies: {
    getAll: async (): Promise<Strategy[]> => {
      try {
        const headers = await getAuthHeaders();
        console.log("Fetching strategies with headers:", headers);

        // Use a longer timeout for this endpoint
        const response = await fetchWithRetry(`${API_BASE_URL}/strategies`, {
          method: "GET",
          headers,
          cache: 'no-store', // Prevent caching issues
        }, 20000); // 20 second timeout

        if (!response.ok) {
          // Check specific response status
          if (response.status === 401) {
            throw new Error('Authentication error. Please log in again.');
          } else if (response.status === 403) {
            throw new Error('You do not have permission to access strategy data.');
          } else if (response.status === 404) {
            return []; // Return empty array if no strategies found
          }

          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // Try to parse the response
        try {
          const data = await response.json();
          console.log("Parsed response data:", data);

          // If we get empty data or no data, return empty array
          if (!data || (Array.isArray(data) && data.length === 0)) {
            console.log("No strategies found or empty data returned");
            return [];
          }

          return data;
        } catch (jsonError) {
          console.error("Error parsing strategy data:", jsonError);
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        console.error("Error in getAll strategies:", error);

        // Provide meaningful errors to user
        if (error instanceof Error) {
          if (error.message.includes('timed out')) {
            throw new Error('Strategy server request timed out. Please try again later.');
          }

          throw error;
        }

        throw new Error('Failed to fetch strategy data');
      }
    },

    initialize: async (): Promise<Strategy[]> => {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(`${API_BASE_URL}/strategies/initialize`, {
        method: "POST",
        headers,
      });
      return handleResponse(response);
    },

    update: async (id: string, data: Partial<Strategy>): Promise<Strategy> => {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(`${API_BASE_URL}/strategies/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },

    squareOff: async (id: string): Promise<{ message: string }> => {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(`${API_BASE_URL}/square-off/strategy/${id}`, {
        method: "POST",
        headers,
      });
      return handleResponse(response);
    },

    squareOffAll: async (): Promise<{ message: string }> => {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(`${API_BASE_URL}/square-off/all`, {
        method: "POST",
        headers,
      });
      return handleResponse(response);
    },
  },

  orders: {
    getAll: async (): Promise<Order[]> => {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(`${API_BASE_URL}/orders`, {
        method: "GET",
        headers,
      });
      return handleResponse(response);
    },

    getById: async (brokerOrderId: string): Promise<Order> => {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(`${API_BASE_URL}/orders/${brokerOrderId}`, {
        method: "GET",
        headers,
      });
      return handleResponse(response);
    },

    cancel: async (brokerOrderId: string): Promise<OrderResponse> => {
      const headers = await getAuthHeaders();
      const response = await fetchWithRetry(`${API_BASE_URL}/orders/${brokerOrderId}`, {
        method: "DELETE",
        headers,
      });
      return handleResponse(response);
    },
  },
};

export { backendApi, type Strategy, type Order, type OrderResponse }; 