import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export function useAuth(requireAuth?: boolean) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("useAuth Debug:", {
      status,
      session,
      requireAuth,
      pathname,
      hasSession: !!session
    });

    if (status === "loading") {
      console.log("Still loading session...");
      return;
    }

    // List of public routes that don't require authentication
    const publicRoutes = ["/login", "/register"];
    const isPublicRoute = publicRoutes.includes(pathname);

    console.log("Route check:", {
      isPublicRoute,
      currentPath: pathname,
      requireAuth,
      hasSession: !!session
    });

    // If the route requires auth and user is not authenticated
    if (requireAuth && !session && !isPublicRoute) {
      console.log("Auth required but no session, redirecting to login");
      router.replace("/login");
    }
    // If user is authenticated and trying to access auth pages (login/register)
    else if (session && isPublicRoute) {
      console.log("User is authenticated, redirecting to settings");
      router.replace("/settings");
    }
  }, [session, status, requireAuth, router, pathname]);

  return { session, status };
}
