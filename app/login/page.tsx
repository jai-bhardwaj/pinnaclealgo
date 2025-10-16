"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { backendAuth } from "@/services/backendAuth";

export default function LoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Login to frontend (NextAuth)
      const signInResponse = await signIn("credentials", {
        username: emailOrUsername,
        password,
        redirect: false,
      });

      if (signInResponse?.error) {
        toast.error(signInResponse.error || "Login failed");
        return;
      }

      // Try to login to backend API
      try {
        await backendAuth.login(emailOrUsername, password);
        toast.success("Login successful! Connected to trading backend.");
        router.push("/dashboard");
      } catch (backendError) {
        console.warn("Backend login failed:", backendError);
        if (process.env.NODE_ENV === "development") {
          toast.success(
            "Login successful! (Using demo data - backend user not found)"
          );
        } else {
          toast.error("Backend authentication failed. Please contact support.");
          return;
        }
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed");
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="emailOrUsername"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email or Username
                </label>
                <div className="mt-1">
                  <input
                    id="emailOrUsername"
                    name="emailOrUsername"
                    type="text"
                    autoComplete="email"
                    required
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
