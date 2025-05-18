"use client";

import { StrategyTable } from "@/app/components/StrategyTable";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg">Loading your account...</div>
        </div>
      </div>
    );
  }

  // Auth is handled by middleware, so if we're here, we're authenticated
  return (
    <div className="grid gap-6">
      <div className="block space-y-2">
        <h2 className="text-xl font-semibold">Strategy Management</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your trading strategies, margins, and status
        </p>
        <StrategyTable />
      </div>
    </div>
  );
}
