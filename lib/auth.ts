import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { backendApi } from "./backend_api";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    access_token: string;
  }
}

// Extend the built-in User type
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    access_token: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username and password are required");
        }

        try {
          console.log(`Auth: attempting login for user ${credentials.username}`);

          // Get the access token
          const authResponse = await backendApi.auth.login(
            credentials.username,
            credentials.password
          );

          if (!authResponse.access_token) {
            console.error("Auth: No access token received");
            throw new Error("Authentication failed: No access token received");
          }

          console.log("Auth: Login successful");

          // Return the user object with the access token
          return {
            id: credentials.username,
            email: credentials.username,
            name: credentials.username,
            access_token: authResponse.access_token,
          };
        } catch (error) {
          console.error("Auth error:", error);

          // Format errors for better user experience
          if (error instanceof Error) {
            // Handle specific error types
            if (error.message.includes("Connection refused") || error.message.includes("connect")) {
              throw new Error("Unable to connect to the authentication server. Please try again later.");
            }

            if (error.message.includes("timeout")) {
              throw new Error("Authentication request timed out. Please try again later.");
            }

            if (error.message.includes("Incorrect username/email or password")) {
              throw new Error("Incorrect username/email or password");
            }

            // Preserve the original error message if none of the above match
            throw error;
          }

          // Generic error fallback
          throw new Error("An unexpected error occurred during authentication");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign in
        console.log("Auth: Adding user data to JWT");
        return {
          ...token,
          access_token: user.access_token,
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.user = {
        ...session.user,
        access_token: token.access_token,
        id: token.id,
        email: token.email,
        name: token.name,
      };
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-dev-secret-do-not-use-in-production",
  debug: true, // Enable debug mode to help diagnose issues
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false, // Set to false to work in both HTTP and HTTPS
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: false,
      },
    },
  },
};
