import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Next.js App Router Route Handler for NextAuth
const handler = NextAuth(authOptions);

// Export the handler for GET and POST requests
export { handler as GET, handler as POST }; 