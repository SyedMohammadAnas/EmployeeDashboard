import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * NextAuth.js API route handler
 * Handles all authentication-related requests
 */
const handler = NextAuth(authOptions);

// Export GET and POST handlers for Next.js 13+ App Router
export { handler as GET, handler as POST };
