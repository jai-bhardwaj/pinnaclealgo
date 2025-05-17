"use client";

import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  // For protected pages, pass true
  useAuth(true);

  return null; // This content won't be shown as we'll redirect to /settings
}
