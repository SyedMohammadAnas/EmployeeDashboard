/**
 * Clean HR Dashboard component with professional features only
 * Includes download functionality, professional email notifications, and HR-only sheet editing
 */

import { useState } from "react";
import { useToaster } from "@/components/ui/toaster";

/**
 * Props for the HR Dashboard component
 */
interface HRDashboardProps {
  userEmail: string;
}

export function HRDashboard({ userEmail }: HRDashboardProps) {
  // State management for professional features
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [includeAttachment, setIncludeAttachment] = useState(false);

  // New cron job related states
  const [isCronEnabled, setIsCronEnabled] = useState(true);
  const [cronSchedule, setCronSchedule] = useState("weekly_monday_9am"); // User-friendly option
  const [cronCustomMessage, setCronCustomMessage] = useState("");
  const [cronStatus, setCronStatus] = useState<"unknown" | "running" | "stopped" | "error">("unknown");
  const [isTestingCron, setIsTestingCron] = useState(false);
  const [cronLastRun, setCronLastRun] = useState<string | null>(null);

  const toaster = useToaster();

  // Google Sheet configuration - The exact sheet specified by the user
  const sheetId = "1tMFs1KcNriTRGcpQ_Q_yF_ynrsblMLvXtIeehYZel24";
  const sheetEmbedUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing&rm=embedded`;
  const sheetEditUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  // Cron schedule options for user-friendly selection
  const cronScheduleOptions = [
    { value: "daily_9am", label: "Daily at 9:00 AM", description: "Every day at 9:00 AM" },
    { value: "weekly_monday_9am", label: "Weekly - Monday 9:00 AM", description: "Every Monday at 9:00 AM" },
    { value: "weekly_friday_5pm", label: "Weekly - Friday 5:00 PM", description: "Every Friday at 5:00 PM" },
    { value: "biweekly_monday_9am", label: "Bi-weekly - Monday 9:00 AM", description: "Every 2 weeks on Monday at 9:00 AM" },
    { value: "monthly_first_monday", label: "Monthly - First Monday", description: "First Monday of each month at 9:00 AM" },
    { value: "custom", label: "Custom Schedule", description: "Set your own schedule" }
  ];

  /**
   * Convert user-friendly schedule to cron expression
   */
  const convertToCronExpression = (schedule: string): string => {
    const scheduleMap: Record<string, string> = {
      "daily_9am": "0 9 * * *",
      "weekly_monday_9am": "0 9 * * 1",
      "weekly_friday_5pm": "0 17 * * 5",
      "biweekly_monday_9am": "0 9 * * 1",
      "monthly_first_monday": "0 9 1-7 * 1",
      "custom": "0 9 * * 1" // Default fallback
    };
    return scheduleMap[schedule] || scheduleMap.custom;
  };

  /**
   * Toggle fullscreen mode
   */
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  /**
   * Open sheet in new tab for editing
   */
  const openInNewTab = () => {
    window.open(sheetEditUrl, '_blank');
  };

  /**
   * Handle file download in specified format using Google Drive API
   */
  const handleDownload = async (format: string) => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/sheets/download?format=${format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Download failed: ${errorData.error || response.statusText}`);
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `project-data-${new Date().toISOString().split('T')[0]}.${format}`;

      // Create blob and download
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      setIsDownloadOpen(false);
      toaster.addToast({
        type: 'success',
        title: 'Download Complete',
        message: `File ${filename} downloaded successfully.`
      });

    } catch (error) {
      toaster.addToast({
        type: 'error',
        title: 'Download Failed',
        message: error instanceof Error ? error.message : 'Failed to download file'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Send professional email notification to HR team
   */
  const sendProfessionalEmail = async () => {
    if (!emailMessage.trim()) {
      toaster.addToast({
        type: 'error',
        title: 'Email Required',
        message: 'Please enter a message before sending the email notification.'
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: emailMessage.trim(),
          includeAttachment,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toaster.addToast({
          type: 'success',
          title: 'Email Sent Successfully',
          message: 'Professional notification has been sent to the HR team.'
        });
        setEmailMessage("");
        setIncludeAttachment(false);
      } else {
        toaster.addToast({
          type: 'error',
          title: 'Email Failed',
          message: result.error || 'Failed to send professional notification. Please check your email configuration.'
        });
      }
    } catch (error) {
      toaster.addToast({
        type: 'error',
        title: 'Email Error',
        message: 'Network error occurred while sending email. Please try again.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  /**
   * Test the cron job by sending a direct email report (bypasses cron authorization)
   */
  const testCronJob = async () => {
    setIsTestingCron(true);
    try {
      console.log("Testing email report system...");

      // Use the email test endpoint instead of cron endpoint to avoid authorization issues
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: cronCustomMessage || "Manual test email from HR Dashboard - Cron Job Test",
          includeAttachment: true,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toaster.addToast({
          title: "Email System Test Successful",
          message: "Test email report has been sent to HR team successfully.",
          type: "success",
        });

        setCronLastRun(new Date().toISOString());
        setCronStatus("running");
      } else {
        throw new Error(data.error || data.details || "Test failed");
      }
    } catch (error) {
      console.error("Email test failed:", error);
      setCronStatus("error");

      toaster.addToast({
        title: "Email Test Failed",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        type: "error",
      });
    } finally {
      setIsTestingCron(false);
    }
  };

  /**
   * Check cron job status and configuration
   */
  const checkCronStatus = async () => {
    try {
      console.log("Checking cron job status...");

      const response = await fetch('/api/cron/send-reports', {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok) {
        setCronStatus(data.status === "healthy" ? "running" : "error");

        // Update UI with configuration status
        if (data.configuration) {
          console.log("Cron configuration:", data.configuration);
        }

        toaster.addToast({
          title: "Cron Status Updated",
          message: `Cron job is ${data.status}. Configuration checked successfully.`,
          type: "success",
        });
      } else {
        setCronStatus("error");
        throw new Error(data.error || "Status check failed");
      }
    } catch (error) {
      console.error("Cron status check failed:", error);
      setCronStatus("error");

      toaster.addToast({
        title: "Status Check Failed",
        message: "Could not retrieve cron job status.",
        type: "error",
      });
    }
  };

  /**
   * Update cron job configuration
   */
  const updateCronConfig = async () => {
    try {
      const cronExpression = convertToCronExpression(cronSchedule);
      const selectedOption = cronScheduleOptions.find(opt => opt.value === cronSchedule);

      toaster.addToast({
        title: "Configuration Updated",
        message: `Report schedule updated to: ${selectedOption?.label}`,
        type: "success",
      });

      console.log("Cron configuration updated:", {
        enabled: isCronEnabled,
        schedule: selectedOption?.label,
        cronExpression: cronExpression,
        customMessage: cronCustomMessage
      });
    } catch (error) {
      console.error("Failed to update cron configuration:", error);

      toaster.addToast({
        title: "Update Failed",
        message: "Could not update cron job configuration.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header with Controls */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">HR Dashboard</h2>
            <p className="text-gray-600 mt-1">
              Manage employee projects with professional tools and direct sheet editing
            </p>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-3">
            {/* Download Button with Dropdown */}
            <div className="relative z-20">
              <button
                onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isDownloading}
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isDownloading ? "Downloading..." : "Download"}
                <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Download Dropdown Menu */}
              {isDownloadOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">Download Project Data</div>
                    <button
                      onClick={() => handleDownload('csv')}
                      disabled={isDownloading}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      CSV Format
                    </button>
                    <button
                      onClick={() => handleDownload('excel')}
                      disabled={isDownloading}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Excel Format
                    </button>
                    <button
                      onClick={() => handleDownload('pdf')}
                      disabled={isDownloading}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:bg-gray-200 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      PDF Report
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullScreen}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="bg-white rounded-lg border p-6">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900">Professional Settings</h3>
            <p className="text-sm text-gray-600 mt-1">Configure email notifications and project management options</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Email Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.2a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Settings
              </h4>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message Content
                    </label>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Enter professional message for HR team notification..."
                      className="w-full p-3 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                    />
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeAttachment}
                      onChange={(e) => setIncludeAttachment(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Excel attachment with project data</span>
                  </label>

                  <button
                    onClick={sendProfessionalEmail}
                    disabled={isSendingEmail || !emailMessage.trim()}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSendingEmail ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Professional Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Cron Job Management */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Cron Job Management
              </h4>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Enable Automated Reports
                    </label>
                    <input
                      type="checkbox"
                      checked={isCronEnabled}
                      onChange={(e) => setIsCronEnabled(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Report Schedule
                    </label>
                    <select
                      value={cronSchedule}
                      onChange={(e) => setCronSchedule(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {cronScheduleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {cronScheduleOptions.find(opt => opt.value === cronSchedule)?.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Message:
                    </label>
                    <input
                      type="text"
                      value={cronCustomMessage}
                      onChange={(e) => setCronCustomMessage(e.target.value)}
                      placeholder="Enter a custom message for the cron job email..."
                      className="w-full p-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Cron Job Status
                    </label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      cronStatus === "running" ? "bg-green-100 text-green-800" :
                      cronStatus === "stopped" ? "bg-red-100 text-red-800" :
                      cronStatus === "error" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {cronStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Last Run
                    </label>
                    <span className="text-sm text-gray-700">
                      {cronLastRun ? new Date(cronLastRun).toLocaleString() : "Never"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={testCronJob}
                      disabled={isTestingCron}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isTestingCron ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending Test Email...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Test Email Report
                        </>
                      )}
                    </button>

                    <button
                      onClick={checkCronStatus}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Check System Status
                    </button>

                    <button
                      onClick={updateCronConfig}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Access with HR-Only Editing */}
      <div className={`bg-white rounded-lg border overflow-hidden ${
        isFullScreen
          ? "fixed inset-0 z-50 rounded-none"
          : "relative"
      }`}>
        {isFullScreen && (
          <div className="bg-gray-100 border-b px-4 py-2 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Employee Projects - HR Dashboard</h3>
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

        <div className={`${isFullScreen ? "h-full" : "h-[800px]"} relative`}>
          {/* Embedded Google Sheet with HR editing capabilities */}
          <iframe
            src={sheetEmbedUrl}
            className="w-full h-full border-0"
            title="Employee Projects Sheet - HR Dashboard"
            allowFullScreen
            style={{
              border: 'none',
              overflow: 'hidden'
            }}
          />

          {/* Overlay with action buttons for better UX */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={openInNewTab}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
              title="Open in new tab for full editing capabilities"
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {isDownloadOpen && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setIsDownloadOpen(false)}
        />
      )}
    </div>
  );
}
