"use client";

import { SessionProvider } from "next-auth/react";
import { UserProvider } from "@/contexts/user-context";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { StoreProvider } from "@/stores";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <SessionProvider>
        <StoreProvider>
          <UserProvider>{children}</UserProvider>
        </StoreProvider>
      </SessionProvider>
    </TRPCProvider>
  );
} 