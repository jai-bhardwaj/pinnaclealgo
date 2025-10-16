import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
// import { env, isDev } from "@/lib/env";
const isDev = process.env.NODE_ENV === "development";

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
        console.log("🔐 NextAuth authorize function called with:", {
          username: credentials?.username,
          hasPassword: !!credentials?.password,
          isDev,
        });

        if (!credentials?.username || !credentials?.password) {
          if (isDev) {
            console.log("Authorize failed: Missing username or password");
          }
          return null;
        }

        try {
          console.log(
            "🔍 Attempting to find user in DB with username:",
            credentials.username
          );
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
              hashedPassword: true,
              role: true,
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

          console.log("🔑 User found, attempting to compare passwords...");
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.hashedPassword
          );
          console.log("🔑 Password comparison result:", isPasswordValid);

          if (!isPasswordValid) {
            if (isDev) {
              console.log("Authorize failed: Incorrect password");
            }
            return null;
          }

          if (isDev) {
            console.log("Authentication successful for user:", user.username);
          }

          return {
            id: user.id,
            username: user.username || user.email, // Use email as fallback if username is null
            email: user.email,
            role: user.role || "USER", // Use actual role from database
            isActive: user.status === "ACTIVE", // Use actual status from database
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
  secret: process.env.NEXTAUTH_SECRET, // Use environment variable directly
  debug: isDev, // Only enable debug in development
};
