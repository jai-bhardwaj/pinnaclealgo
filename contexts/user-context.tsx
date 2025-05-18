"use client";

import React, { createContext, useContext } from "react";
import { useSession } from "next-auth/react";

// Define user type
type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
};

// Define context type
type UserContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

// Create context with default values
const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // Transform session data into user object
  const user: User | null = session
    ? {
      id: (session.user as any)?.id || "default-id",
      name: session.user?.name || null,
      email: session.user?.email || null,
      role: (session.user as any)?.role || "user",
      image: session.user?.image || null,
    }
    : null;

  // Determine authentication state
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!user;

  return (
    <UserContext.Provider value={{ user, isLoading, isAuthenticated }}>
      {children}
    </UserContext.Provider>
  );
}

// Hook to access user context
export function useUser() {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}
