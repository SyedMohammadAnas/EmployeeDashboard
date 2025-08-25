import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateEmailConfiguration, sendCustomNotificationToHR } from "@/lib/email";

/**
 * POST /api/email/test
 * Send professional email notification to HR team
 * Only accessible by HR users
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Professional email endpoint called - POST");

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // @ts-ignore - Custom role field added in auth configuration
    const userRole = session.user.role;
    const userEmail = session.user.email;

    console.log(`Professional email requested by: ${userEmail} (role: ${userRole})`);

    // Check if user is HR
    if (userRole !== "hr") {
      return NextResponse.json(
        { error: "Access denied. Only HR can send professional emails." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { message, includeAttachment } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Message content is required for professional emails" },
        { status: 400 }
      );
    }

    // First validate email configuration
    const configValidation = await validateEmailConfiguration();
    if (!configValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Email configuration validation failed",
          details: configValidation.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    console.log("Email configuration validated, sending professional notification");

    // Send professional notification
    const emailSubject = "Project Management Update";
    const success = await sendCustomNotificationToHR(
      emailSubject,
      message.trim(),
      includeAttachment || false
    );

    if (!success) {
      throw new Error("Failed to send professional notification");
    }

    console.log(`Professional email sent successfully by HR user: ${userEmail}`);
    return NextResponse.json({
      success: true,
      message: "Professional notification sent successfully to HR team.",
      details: {
        emailSent: true,
        includeAttachment: includeAttachment || false,
        sentBy: userEmail,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Professional email endpoint failed:", error);

    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/test
 * Check email configuration status for professional use
 * Only accessible by HR users
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Email configuration check endpoint called - GET");

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // @ts-ignore - Custom role field added in auth configuration
    const userRole = session.user.role;
    const userEmail = session.user.email;

    console.log(`Email configuration check requested by: ${userEmail} (role: ${userRole})`);

    // Check if user is HR
    if (userRole !== "hr") {
      return NextResponse.json(
        { error: "Access denied. Only HR can check email configuration." },
        { status: 403 }
      );
    }

    // Use the professional validation function
    const validation = await validateEmailConfiguration();

    const response = {
      status: validation.success ? "ready" : "incomplete",
      configuration: validation.configuration,
      message: validation.message,
      timestamp: new Date().toISOString(),
      checkedBy: userEmail,
    };

    console.log(`Email configuration check completed for ${userEmail}`);
    return NextResponse.json(response);

  } catch (error) {
    console.error("Email configuration check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
