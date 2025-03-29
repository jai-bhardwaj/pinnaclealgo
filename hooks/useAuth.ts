import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export function useAuth(requireAuth?: boolean) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    if (requireAuth && !session) {
      router.push("/login");
    } else if (session && (pathname === "/login" || pathname === "/register")) {
      router.push("/settings");
    }
  }, [session, status, requireAuth, router, pathname]);

  return { session, status };
}
