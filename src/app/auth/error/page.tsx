"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

/**
 * Authentication error page that handles NextAuth.js error scenarios
 * Displays user-friendly error messages and provides navigation options
 */
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Define error messages for different error types
  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case "AccessDenied":
        return {
          title: "Access Denied",
          message: "You don't have permission to access this application. Please contact your administrator if you believe this is an error.",
          details: "This usually happens when your email domain is not in the allowed company domain list."
        };
      case "Configuration":
        return {
          title: "Configuration Error",
          message: "There's a problem with the authentication configuration. Please try again later.",
          details: "This is a server-side issue that needs to be resolved by the development team."
        };
      case "Verification":
        return {
          title: "Verification Required",
          message: "Your account needs to be verified before you can access this application.",
          details: "Please check your email for verification instructions or contact support."
        };
      default:
        return {
          title: "Authentication Error",
          message: "An unexpected error occurred during authentication. Please try again.",
          details: "If the problem persists, please contact support."
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {/* Error icon */}
          <div className="mx-auto h-16 w-16 bg-red-600 rounded-lg flex items-center justify-center mb-6">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          {/* Error title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h1>

          {/* Error message */}
          <p className="text-gray-600 mb-4">
            {errorInfo.message}
          </p>

          {/* Error details */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              {errorInfo.details}
            </p>
          </div>

          {/* Navigation buttons */}
          <div className="space-y-3">
            <Link
              href="/"
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Try Again
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Go Back
            </button>
          </div>

          {/* Additional help */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact your system administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main component with Suspense boundary for useSearchParams
 */
export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
