"use client";

import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { UserProvider } from "@/contexts/user-context";
import { TRPCProvider } from "@/lib/trpc/TRPCProvider";
import { StoreProvider } from "@/stores";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <TRPCProvider>
            <SessionProvider>
              <StoreProvider>
                <UserProvider>{children}</UserProvider>
              </StoreProvider>
            </SessionProvider>
          </TRPCProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
