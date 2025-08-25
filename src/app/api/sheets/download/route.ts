import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  downloadSheetFile,
  testDriveConnection,
  type ExportFormat
} from "@/lib/drive-download";

/**
 * GET /api/sheets/download?format=csv|excel|pdf
 * Downloads data directly from Google Sheet using Google Drive API
 * Provides clean file downloads without metadata processing
 * Only accessible by HR users
 */
export async function GET(request: NextRequest) {
  // Add CORS headers to prevent blocking
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    console.log("Processing sheet download request...");

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log("Authentication required for sheet download");
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
      console.log(`Access denied for sheet download: ${userEmail} is not HR`);
      return NextResponse.json(
        { error: "Access denied. Only HR can download sheet data." },
        { status: 403, headers }
      );
    }

    // Get format from query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Validate format
    const supportedFormats = ['csv', 'excel', 'pdf'];
    if (!supportedFormats.includes(format.toLowerCase())) {
      console.log(`Invalid format requested: ${format}`);
      return NextResponse.json(
        { error: "Invalid format. Supported formats: csv, excel, pdf" },
        { status: 400, headers }
      );
    }

    console.log(`HR user ${userEmail} requesting download in ${format} format`);

    // Download the file directly using Google Drive API
    console.log("Starting direct download from Google Drive...");
    const { buffer, contentType, filename } = await downloadSheetFile(format as ExportFormat);

    console.log(`Successfully downloaded file: ${filename}`);
    console.log(`File size: ${buffer.byteLength} bytes`);

    // Return the file with proper headers for download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Length': buffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error("Sheet download failed:", error);

    // Return detailed error information for debugging
    return NextResponse.json(
      {
        error: "Failed to download sheet data",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        help: "Check console logs for detailed error information. Ensure Google Drive API credentials are properly configured."
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

/**
 * POST /api/sheets/download/test
 * Test endpoint to verify Google Drive API connection
 * Only accessible by HR users
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Processing sheet connection test...");

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

    // Check if user is HR
    if (userRole !== "hr") {
      console.log(`Access denied for connection test: ${userEmail} is not HR`);
      return NextResponse.json(
        { error: "Access denied. Only HR can test sheet connection." },
        { status: 403 }
      );
    }

    console.log(`Testing drive connection for HR user: ${userEmail}`);

    // Test the Google Drive API connection
    const testResult = await testDriveConnection();

    console.log("Connection test completed:", testResult.success ? "SUCCESS" : "FAILED");

    return NextResponse.json({
      ...testResult,
      testedBy: userEmail,
      message: testResult.success
        ? "Google Drive API connection is working properly"
        : "Google Drive API connection failed - check credentials and permissions"
    });

  } catch (error) {
    console.error("Connection test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Connection test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        help: "This indicates a fundamental issue with Google Drive API setup. Check environment variables and service account configuration."
      },
      { status: 500 }
    );
  }
}
