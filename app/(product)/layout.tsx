"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function ProductLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "loading") return; // Still loading

        if (status === "unauthenticated") {
            // Redirect to login if not authenticated
            window.location.href = "/login";
            return;
        }
    }, [status]);

    // Show loading while checking authentication
    if (status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Show nothing while redirecting
    if (status === "unauthenticated") {
        return null;
    }

    // Render the authenticated layout
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <main className="flex-1 overflow-auto" suppressHydrationWarning>
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
} 