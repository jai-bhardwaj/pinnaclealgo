"use client";

import { StrategyTable } from "@/app/components/StrategyTable";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <div className="grid gap-6">
        <div className="block space-y-2">
          <h2 className="text-xl font-semibold">Strategy Management</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your trading strategies, margins, and status
          </p>
          <StrategyTable />
        </div>
      </div>
    </>
  );
}
