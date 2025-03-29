"use client";

import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  // For auth pages (login/register), don't pass any parameter
  useAuth();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
