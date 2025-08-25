import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/**
 * NextAuth.js configuration with Google OAuth and domain restrictions
 * Only allows users from the specified company domain to authenticate
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request additional scopes for Google Sheets access
          scope: "openid email profile https://www.googleapis.com/auth/spreadsheets",
        },
      },
    }),
  ],

  // Custom pages for authentication
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    /**
     * Sign-in callback to restrict access to company domain
     * Only allows users with emails ending in the specified company domain
     */
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user.email || "";

        // Allow multiple domains for testing (comma-separated)
        const allowedDomains = process.env.COMPANY_DOMAIN?.split(",").map(d => d.trim()) || ["@hines.com"];

        // Check if user email belongs to any allowed company domain
        const isAllowedDomain = allowedDomains.some(domain => email.endsWith(domain));

        if (!isAllowedDomain) {
          console.log(`Access denied for ${email} - not from allowed domains: ${allowedDomains.join(", ")}`);
          return false;
        }

        console.log(`Access granted for ${email} from domain ${allowedDomains.find(d => email.endsWith(d))}`);
        return true;
      }
      return true;
    },

    /**
     * JWT callback to add custom fields to the token
     * Determines user role based on HR emails list
     */
    async jwt({ token, user, account }) {
      // Add user info to token on initial sign in
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;

        // Determine user role (HR or Employee)
        const hrEmails = process.env.HR_EMAILS?.split(",") || [];
        token.role = hrEmails.includes(user.email || "") ? "hr" : "employee";
      }

      // Store access token for Google API calls
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      return token;
    },

    /**
     * Session callback to add custom fields to the session
     * Makes user role and other info available in client components
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        // @ts-ignore - Adding custom role field
        session.user.role = token.role as string;
        // @ts-ignore - Adding access token for API calls
        session.user.accessToken = token.accessToken as string;
      }
      return session;
    },
  },

  // Events for logging and debugging
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ session }) {
      console.log(`User signed out: ${session?.user?.email}`);
    },
  },
};

/**
 * Helper function to check if user has HR role
 * @param userEmail - User's email address
 * @returns boolean indicating if user is HR
 */
export function isHR(userEmail: string): boolean {
  const hrEmails = process.env.HR_EMAILS?.split(",") || [];
  return hrEmails.includes(userEmail);
}

/**
 * Helper function to check if user belongs to company domain
 * @param userEmail - User's email address
 * @returns boolean indicating if user is from company domain
 */
export function isCompanyUser(userEmail: string): boolean {
  const companyDomain = process.env.COMPANY_DOMAIN || "@yourcompany.com";
  return userEmail.endsWith(companyDomain);
}
