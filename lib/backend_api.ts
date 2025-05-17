import { getSession } from "next-auth/react";

const API_BASE_URL = "http://localhost:8000";

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
  console.log("Session:", session);
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
      localStorage.removeItem('access_token');
      window.location.href = '/login';  // Redirect to login page
      throw new Error('Session expired. Please log in again.');
    }
    
    const error = new Error(errorMessage) as ApiError;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return response.json();
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout = 5000) {
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
      if (error.name === "TypeError" && error.message === "Failed to fetch") {
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
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetchWithTimeout(`${API_BASE_URL}/auth/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        });
        const data = await handleResponse(response);
        if (!data.access_token) {
          console.error('No access token in response:', data);
          throw new Error('Invalid login response');
        }
        return data;
      } catch (error) {
        console.error('Login error:', error);
        if (error instanceof Error) {
          if (error.message.includes('Failed to fetch')) {
            throw new Error('Could not connect to the server. Please check if the server is running.');
          }
          throw error;
        }
        throw new Error('An unexpected error occurred during login');
      }
    },

    register: async (username: string, email: string, password: string): Promise<UserResponse> => {
      const response = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
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
      const response = await fetchWithTimeout(`${API_BASE_URL}/users/me`, {
        method: "GET",
        headers,
      });
      return handleResponse(response);
    },

    logout: () => {
      localStorage.removeItem('access_token');
    },
  },

  // Strategy endpoints
  strategies: {
    getAll: async (): Promise<Strategy[]> => {
      const headers = await getAuthHeaders();
      console.log("Fetching strategies with headers:", headers);
      const response = await fetchWithTimeout(`${API_BASE_URL}/strategies`, {
        method: "GET",
        headers,
      });
      console.log("Raw response:", response);
      const data = await handleResponse(response);
      console.log("Parsed response data:", data);
      return data;
    },

    initialize: async (): Promise<Strategy[]> => {
      const headers = await getAuthHeaders();
      const response = await fetchWithTimeout(`${API_BASE_URL}/strategies/initialize`, {
        method: "POST",
        headers,
      });
      return handleResponse(response);
    },

    update: async (id: string, data: Partial<Strategy>): Promise<Strategy> => {
      const headers = await getAuthHeaders();
      const response = await fetchWithTimeout(`${API_BASE_URL}/strategies/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },

    squareOff: async (id: string): Promise<{ message: string }> => {
      const headers = await getAuthHeaders();
      const response = await fetchWithTimeout(`${API_BASE_URL}/square-off/strategy/${id}`, {
        method: "POST",
        headers,
      });
      return handleResponse(response);
    },

    squareOffAll: async (): Promise<{ message: string }> => {
      const headers = await getAuthHeaders();
      const response = await fetchWithTimeout(`${API_BASE_URL}/square-off/all`, {
        method: "POST",
        headers,
      });
      return handleResponse(response);
    },
  },

  orders: {
    getAll: async (): Promise<Order[]> => {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to fetch orders");
      }

      return response.json();
    },

    getById: async (brokerOrderId: string): Promise<Order> => {
      const response = await fetch(`${API_BASE_URL}/orders/${brokerOrderId}`, {
        headers: await getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to fetch order");
      }

      return response.json();
    },

    cancel: async (brokerOrderId: string): Promise<OrderResponse> => {
      const response = await fetch(`${API_BASE_URL}/orders/${brokerOrderId}`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to cancel order");
      }

      return response.json();
    },
  },
};

export { backendApi, type Strategy, type Order, type OrderResponse }; 