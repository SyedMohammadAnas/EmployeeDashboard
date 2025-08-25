import { NextRequest, NextResponse } from "next/server";
import { sendProjectReportToHR } from "@/lib/email";

/**
 * POST /api/cron/send-reports
 * Automated cron job endpoint for sending weekly project reports to HR
 * Protected by CRON_SECRET environment variable
 *
 * This endpoint should be called by Vercel Cron Jobs or external cron services
 * Example cron schedule: "0 9 * * 1" (Every Monday at 9 AM)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET environment variable not configured");
      return NextResponse.json(
        { error: "Cron job configuration error" },
        { status: 500 }
      );
    }

    // Check authorization header
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.log("Unauthorized cron job attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body for optional custom message
    let customMessage: string | undefined;
    try {
      const body = await request.json();
      customMessage = body.customMessage;
    } catch {
      // Body is optional, ignore parsing errors
    }

    // Send the report
    console.log("Starting automated project report generation...");

    const success = await sendProjectReportToHR(customMessage);

    if (success) {
      const message = "Automated project report sent successfully to HR team";
      console.log(message);

      return NextResponse.json({
        success: true,
        message,
        timestamp: new Date().toISOString(),
        customMessage: customMessage || null,
      });
    } else {
      throw new Error("Failed to send report");
    }

  } catch (error) {
    console.error("Cron job failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to send automated report",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/send-reports
 * Health check endpoint for the cron job
 * Returns cron job configuration status
 */
export async function GET(request: NextRequest) {
  try {
    // Check if cron secret is configured
    const cronSecret = process.env.CRON_SECRET;
    const hrEmails = process.env.HR_EMAILS;
    const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

    return NextResponse.json({
      status: "healthy",
      configuration: {
        cronSecretConfigured: !!cronSecret,
        hrEmailsConfigured: !!hrEmails,
        smtpConfigured,
        hrEmailCount: hrEmails ? hrEmails.split(",").length : 0,
      },
      timestamp: new Date().toISOString(),
      message: "Cron job endpoint is ready",
    });

  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
