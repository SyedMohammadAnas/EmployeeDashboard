"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/**
 * Providers component that wraps the application with necessary context providers
 * Includes NextAuth session provider for authentication state management
 * Configured to reduce excessive polling and API calls
 */
interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      // Reduce session polling to prevent excessive API calls
      refetchInterval={5 * 60} // 5 minutes instead of default 1 minute
      refetchOnWindowFocus={false} // Disable refetch on window focus
      refetchWhenOffline={false} // Disable refetch when offline
    >
      {children}
    </SessionProvider>
  );
}
