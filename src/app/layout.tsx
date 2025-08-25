import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

// Load Inter font with Latin subset and optimized settings to prevent excessive API calls
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Employee Project Manager",
  description: "Manage employee projects with Google Sheets integration and role-based access control",
  icons: {
    icon: "/favicon.ico",
  },
};

/**
 * Root layout component for the Employee Project Manager application
 * Includes session provider, global styles, and font configuration
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 antialiased">
        {/* NextAuth session provider and other context providers */}
        <Providers>
          {/* Main application content */}
          <div className="min-h-screen">
            {children}
          </div>
          {/* Professional toaster notifications */}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
