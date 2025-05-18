"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  // Redirect to settings on home page
  useEffect(() => {
    router.push('/settings');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Redirecting to dashboard...</div>
    </div>
  );
}
