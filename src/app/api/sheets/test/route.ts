import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { testConnection } from "@/lib/google-sheets";

/**
 * GET /api/sheets/test
 * Test Google Sheets API connection and authentication
 * Only accessible by HR users
 */
export async function GET(request: NextRequest) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    console.log("Processing Google Sheets connection test...");

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("Authentication required for connection test");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers }
      );
    }

    // @ts-ignore - Custom role field added in auth configuration
    const userRole = session.user.role;
    const userEmail = session.user.email;

    // Check if user is HR
    if (userRole !== "hr") {
      console.log(`Access denied for connection test: ${userEmail} is not HR`);
      return NextResponse.json(
        { error: "Access denied. Only HR can test sheet connection." },
        { status: 403, headers }
      );
    }

    console.log(`Testing sheet connection for HR user: ${userEmail}`);

    // Run the connection test
    const testResult = await testConnection();

    console.log("Connection test completed:", testResult.success ? "SUCCESS" : "FAILED");

    return NextResponse.json({
      ...testResult,
      testedBy: userEmail,
      message: testResult.success
        ? "Google Sheets API connection is working properly"
        : "Google Sheets API connection failed - check credentials and permissions"
    }, { status: testResult.success ? 200 : 500, headers });

  } catch (error) {
    console.error("Connection test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Connection test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        help: "This indicates a fundamental issue with Google Sheets API setup. Check environment variables and service account configuration."
      },
      { status: 500, headers }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
