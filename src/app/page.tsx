"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";
import { HRDashboard } from "@/components/dashboard/hr-dashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Image from 'next/image';

/**
 * Main page component that handles authentication and role-based routing
 * Displays different dashboards based on user role (HR vs Employee)
 */
export default function HomePage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  // Handle loading state
  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status]);

  /**
   * Handle sign in with Google
   */
  const handleSignIn = async () => {
    try {
      await signIn("google", {
        callbackUrl: "/",
        redirect: true
      });
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  /**
   * Handle sign out
   */
  const handleSignOut = async () => {
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true
      });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in page if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            {/* App logo and title */}
            <div className="mx-auto h-30 w-60  rounded-lg flex items-center justify-center mb-6">
              <Image
                src="/logo/HinesLogo1.png"
                alt="Hines Logo"
                width={300}
                height={300}
                className="h-30 w-60"
              />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Project Manager
            </h2>

            <p className="text-gray-600 mb-8">
              Sign in with your company Google account to manage your projects
            </p>
          </div>

          {/* Sign in button */}
          <div>
            {/*
              Sign in button with an extra ring around it for visual emphasis.
              We use two focus rings: one with a larger offset and lighter color, and one with the default blue.
              The outer ring is created using a before pseudo-element via Tailwind's peer and relative/absolute positioning.
            */}
            <div className="relative w-full">
              {/* Outer ring using absolute div for offset effect */}
              <div
                className="absolute inset-0 z-0 rounded-2xl pointer-events-none
                  ring-4 ring-blue-400 ring-offset-2 ring-offset-blue-200
                  transition-all duration-200"
                aria-hidden="true"
              />
              <button
                onClick={handleSignIn}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-2xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 z-10"
              >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {/* Google icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </span>
              Sign in with Google
            </button>
            </div>
          </div>

          {/* Additional information */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Only employees with company email addresses can access this system
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Determine user role and show appropriate dashboard
  // @ts-ignore - Custom role field added in auth configuration
  const userRole = session.user?.role;
  const userName = session.user?.name || "User";
  const userEmail = session.user?.email || "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* App title and user info */}
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Employee Project Manager
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome, {userName} ({userRole === "hr" ? "HR" : "Employee"})
                </p>
              </div>
            </div>

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {userRole === "hr" ? (
          // HR Dashboard - shows all projects with statistics and export functionality
          <HRDashboard userEmail={userEmail} />
        ) : (
          // Employee Dashboard - shows only user's own projects with form to add/edit
          <EmployeeDashboard userEmail={userEmail} userName={userName} />
        )}
      </main>
    </div>
  );
}
