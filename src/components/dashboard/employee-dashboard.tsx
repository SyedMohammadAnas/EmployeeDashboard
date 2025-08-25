/**
 * Employee Dashboard Component
 * Provides embedded Google Sheets access for employees to manage all projects
 * All employees can view, edit, and collaborate on projects together
 */

import { useState, useEffect } from "react";

/**
 * Props for the Employee Dashboard component
 */
interface EmployeeDashboardProps {
  userEmail: string;
  userName: string;
}

/**
 * Interface for user sheet data from API
 */
interface UserSheetData {
  embedUrl: string;
  viewUrl: string;
  userEmail: string;
  userRole: string;
  sheetId: string;
}

export function EmployeeDashboard({ userEmail, userName }: EmployeeDashboardProps) {
  // State for managing the embedded sheet
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [sheetData, setSheetData] = useState<UserSheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPermissionNote, setShowPermissionNote] = useState(true);

  /**
   * Fetch user-specific sheet URLs from API
   */
  const fetchSheetData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/projects/user-sheet');

      if (!response.ok) {
        throw new Error('Failed to fetch sheet data');
      }

      const data = await response.json();
      if (data.success) {
        setSheetData(data);
      } else {
        throw new Error(data.error || 'Failed to load sheet data');
      }
    } catch (err) {
      console.error('Error fetching sheet data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load sheet data on component mount
   */
  useEffect(() => {
    fetchSheetData();
  }, []);

  /**
   * Toggle fullscreen mode for the embedded sheet
   */
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  /**
   * Open sheet in new tab
   */
  const openSheet = () => {
    if (sheetData) {
      window.open(sheetData.viewUrl, '_blank');
    }
  };

  /**
   * Dismiss permission note
   */
  const dismissPermissionNote = () => {
    setShowPermissionNote(false);
  };

  /**
   * Refresh sheet data
   */
  const refreshSheet = () => {
    fetchSheetData();
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="animate-spin h-8 w-8 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h2>
            <p className="text-gray-600">Preparing your project workspace</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-red-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>

            {/* Show fallback option for Google Sheets access */}
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-3">
                <strong>Alternative Access:</strong> You can still access your projects directly in Google Sheets.
              </p>
              <button
                onClick={() => window.open(`https://docs.google.com/spreadsheets/d/1tMFs1KcNriTRGcpQ_Q_yF_ynrsblMLvXtIeehYZel24/edit`, '_blank')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Google Sheets Directly
              </button>
            </div>

            <button
              onClick={refreshSheet}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome, {userName}!</h2>
            <p className="text-gray-600 mt-1">
              Manage your projects directly in the embedded Google Sheet below
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleFullScreen}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-blue-500"
              title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isFullScreen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9V4.5M15 9h4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15v4.5M15 15h4.5m0 0l5.25 5.25" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                )}
              </svg>
              {isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>

            <button
              onClick={openSheet}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in Google Sheets
            </button>

            <button
              onClick={refreshSheet}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-blue-500"
              title="Refresh Sheet"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Google Sheets Access - Direct link instead of iframe to prevent tracking */}
      {sheetData ? (
        <div className={`bg-white rounded-lg border overflow-hidden ${
          isFullScreen
            ? "fixed inset-0 z-50 rounded-none"
            : "relative"
        }`}>
          {isFullScreen && (
            <div className="bg-gray-100 border-b px-4 py-2 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Your Projects - Google Sheet</h3>
              <button
                onClick={toggleFullScreen}
                className="text-gray-600 hover:text-gray-900 p-1"
                title="Exit Fullscreen"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className={`${isFullScreen ? "h-full" : "h-[600px]"} flex flex-col items-center justify-center p-8`}>
            {/* Direct access card */}
            <div className="text-center max-w-md">
              <div className="mx-auto h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">Your Projects Sheet</h3>
              <p className="text-gray-600 mb-6">
                Access your Google Sheet directly to view and edit your projects. This prevents excessive tracking and improves performance.
              </p>

              <button
                onClick={openSheet}
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Google Sheet
              </button>

              <p className="text-xs text-gray-500 mt-3">
                Opens in a new tab for better performance and security
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Fallback when sheet data is not available
        <div className="bg-white rounded-lg border p-6">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sheet Not Available</h3>
            <p className="text-gray-600 mb-4">
              The embedded sheet is currently unavailable. You can still access your projects directly in Google Sheets.
            </p>
            <button
              onClick={() => window.open(`https://docs.google.com/spreadsheets/d/1tMFs1KcNriTRGcpQ_Q_yF_ynrsblMLvXtIeehYZel24/edit`, '_blank')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-3 focus:ring-offset-2 focus:ring-green-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Google Sheets
            </button>
          </div>
        </div>
      )}

      {/* Collaboration Notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <p className="text-sm text-purple-700">
            <strong>🤝 Team Collaboration:</strong> You can now view and edit all projects in the team.
            Add your own projects, update existing ones, and collaborate with your colleagues.
            All changes are automatically saved and visible to everyone.
          </p>
        </div>
      </div>
    </div>
  );
}
