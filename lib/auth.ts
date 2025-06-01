import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { env, isDev } from "@/lib/env";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (isDev) {
          console.log("NextAuth authorize function called");
        }

        if (!credentials?.username || !credentials?.password) {
          if (isDev) {
            console.log("Authorize failed: Missing username or password");
          }
          return null;
        }

        try {
          if (isDev) {
            console.log("Attempting to find user in DB...");
          }
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { username: credentials.username },
                { email: credentials.username },
              ],
            },
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              hashedPassword: true,
              status: true,
            },
          });

          if (isDev) {
            console.log(
              "DB Query Result:",
              user ? "User found" : "User not found"
            );
          }

          if (!user) {
            if (isDev) {
              console.log("Authorize failed: User not found");
            }
            return null;
          }

          if (isDev) {
            console.log("User found, attempting to compare passwords...");
          }
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.hashedPassword
          );

          if (isDev) {
            console.log("Password comparison result:", isPasswordValid);
          }

          if (!isPasswordValid) {
            if (isDev) {
              console.log("Authorize failed: Incorrect password");
            }
            return null;
          }

          if (user.status !== "ACTIVE") {
            if (isDev) {
              console.log("Authorize failed: User account is not active");
            }
            return null;
          }

          if (isDev) {
            console.log("Authentication successful for user:", user.username);
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.status === "ACTIVE",
          };
        } catch (error) {
          // Only log full error details in development
          if (isDev) {
            console.error("Authentication error:", error);
          } else {
            console.error("Authentication failed for security reasons");
          }
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.username = user.username;
        token.role = user.role;
        token.isActive = user.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId;
        session.user.username = token.username;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: env.NEXTAUTH_SECRET, // Now properly validated, no fallback
  debug: isDev, // Only enable debug in development
};
