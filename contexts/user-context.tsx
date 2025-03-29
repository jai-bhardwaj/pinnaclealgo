"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
};

type UserContextType = {
  user: User | null;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
});

// Routes that don't require authentication
const publicRoutes = ["/login", "/register", "/forgot-password"];

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleRouting = async () => {
      // Still loading the session
      if (status === "loading") {
        setLoading(true);
        return;
      }

      const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
      );

      if (status === "authenticated" && session) {
        setLoading(false);
        // If on public route (like login), redirect to default route
        if (isPublicRoute) {
          router.push("/settings");
        }
      } else if (status === "unauthenticated") {
        setLoading(false);
        // If trying to access any non-public route without auth, redirect to login
        if (!isPublicRoute) {
          router.push("/login");
        }
      }
    };

    handleRouting();
  }, [session, status, router, pathname]);

  const user: User | null = session
    ? {
        id: (session.user as any)?.id || "default-id",
        name: session.user?.name || null,
        email: session.user?.email || null,
        role: (session.user as any)?.role || "user",
        image: session.user?.image || null,
      }
    : null;

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
