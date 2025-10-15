"use client";

import { SessionProvider } from "next-auth/react";
import { UserProvider } from "@/contexts/user-context";
import { TRPCProvider } from "@/components/providers/trpc-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <SessionProvider>
        <UserProvider>{children}</UserProvider>
      </SessionProvider>
    </TRPCProvider>
  );
}
