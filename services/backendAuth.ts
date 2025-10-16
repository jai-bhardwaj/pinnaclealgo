// Backend Authentication Service
// Handles authentication with the trading backend API

interface BackendAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: any;
}

interface BackendLoginRequest {
  username: string;
  password: string;
}

class BackendAuthService {
  private token: string | null = null;
  private tokenExpiry: number | null = null;

  // Login to backend with frontend credentials
  async login(username: string, password: string): Promise<BackendAuthResponse> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Backend authentication failed");
    }

    const data: BackendAuthResponse = await response.json();
    
    // Store token and expiry
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000);
    
    // Store in localStorage for persistence
    localStorage.setItem("backend_token", data.access_token);
    localStorage.setItem("backend_token_expiry", this.tokenExpiry.toString());
    
    return data;
  }

  // Get current token (check if expired)
  getToken(): string | null {
    if (!this.token) {
      // Try to restore from localStorage
      const storedToken = localStorage.getItem("backend_token");
      const storedExpiry = localStorage.getItem("backend_token_expiry");
      
      if (storedToken && storedExpiry) {
        const expiry = parseInt(storedExpiry);
        if (Date.now() < expiry) {
          this.token = storedToken;
          this.tokenExpiry = expiry;
        } else {
          // Token expired, clear storage
          this.clearToken();
        }
      }
    }
    
    return this.token;
  }

  // Check if token is valid
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Clear token and logout
  clearToken(): void {
    this.token = null;
    this.tokenExpiry = null;
    localStorage.removeItem("backend_token");
    localStorage.removeItem("backend_token_expiry");
  }

  // Get authorization header
  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export const backendAuth = new BackendAuthService();
