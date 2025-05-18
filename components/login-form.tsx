"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { status } = useSession();

  // Monitor session status and redirect if authenticated
  useEffect(() => {
    if (status === "authenticated") {
      // Use plain browser navigation to avoid routing issues
      window.location.href = `/settings?t=${Date.now()}`;
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    if (!usernameOrEmail || !password) {
      setError("Username and password are required");
      setIsLoading(false);
      return;
    }

    try {
      console.log(`Attempting to sign in with username: ${usernameOrEmail}`);

      const result = await signIn("credentials", {
        username: usernameOrEmail,
        password,
        redirect: false, // Handle redirect manually
      });

      if (result?.error) {
        // Handle specific errors
        if (result.error.includes("connect")) {
          setError("Unable to connect to authentication server. Please try again later.");
        } else if (result.error.includes("Incorrect")) {
          setError("Incorrect username/email or password");
        } else {
          setError(result.error);
        }
      } else if (result?.ok) {
        setSuccess(true);
        // Force navigation using browser redirect with cache busting
        window.location.href = `/settings?t=${Date.now()}`;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Invalid username/email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your username or email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="bg-green-50 border border-green-300 text-green-900 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">Login successful! Redirecting to dashboard...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                {error && (
                  <div className="bg-red-50 border border-red-300 text-red-900 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}

                <div className="grid gap-3">
                  <Label htmlFor="username">Username or Email</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username or email"
                    required
                    disabled={isLoading}
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
