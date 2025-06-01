import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const isDevelopment = process.env.NODE_ENV === 'development';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (isDevelopment) {
          console.log('NextAuth authorize function called');
        }

        if (!credentials?.username || !credentials?.password) {
          if (isDevelopment) {
            console.log('Authorize failed: Missing username or password');
          }
          return null;
        }

        try {
          if (isDevelopment) {
            console.log('Attempting to find user in DB...');
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

          if (isDevelopment) {
            console.log('DB Query Result:', user ? 'User found' : 'User not found');
          }

          if (!user) {
            if (isDevelopment) {
              console.log('Authorize failed: User not found');
            }
            return null;
          }

          if (isDevelopment) {
            console.log('User found, attempting to compare passwords...');
          }
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.hashedPassword
          );

          if (isDevelopment) {
            console.log('Password comparison result:', isPasswordValid);
          }

          if (!isPasswordValid) {
            if (isDevelopment) {
              console.log('Authorize failed: Incorrect password');
            }
            return null;
          }

          if (user.status !== 'ACTIVE') {
            if (isDevelopment) {
              console.log('Authorize failed: User account is not active');
            }
            return null;
          }

          if (isDevelopment) {
            console.log('Authentication successful for user:', user.username);
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.status === 'ACTIVE',
          };
        } catch (error) {
          console.error('Authentication error:', isDevelopment ? error : 'Authentication failed');
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
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
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}; 