"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function HomePage() {
  const { status } = useSession();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (status === "authenticated") {
      // Redirect to dashboard if authenticated
      window.location.href = "/dashboard";
    } else {
      // Redirect to login if not authenticated
      window.location.href = "/login";
    }
  }, [status]);

  // Show loading while checking authentication
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
