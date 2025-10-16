import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

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
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
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

          if (!user || user.status !== "ACTIVE") {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.hashedPassword
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            username: user.username || user.email,
            email: user.email,
            role: user.role || "USER",
            isActive: user.status === "ACTIVE",
          };
        } catch (error) {
          console.error("Authentication error:", error);
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
  events: {
    async signOut() {
      // Clear backend token on logout
      if (typeof window !== "undefined") {
        const { backendAuth } = await import("@/services/backendAuth");
        backendAuth.clearToken();
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: isDev,
};
