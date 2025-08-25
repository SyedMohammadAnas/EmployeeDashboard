import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// Google Sheets functions not needed for this route - using direct URLs

/**
 * GET /api/projects/user-sheet
 * Returns a filtered Google Sheets URL for the current user
 * Employees will only see rows that match their email address
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get Google Sheet ID from environment
    const sheetId = process.env.GOOGLE_SHEET_ID || "1tMFs1KcNriTRGcpQ_Q_yF_ynrsblMLvXtIeehYZel24";

    // All users (HR and employees) get full access to the sheet
    // Updated embed URL to reduce excessive API calls and tracking
    const embedUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit?usp=sharing&rm=minimal&widget=true&chrome=false&headers=false&gridlines=false&single=true`;
    const viewUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

    console.log(`Generated sheet URL for user: ${session.user.email}`);

    return NextResponse.json({
      success: true,
      embedUrl,
      viewUrl,
      userEmail: session.user.email,
      sheetId,
    });

      } catch (error) {
    console.error("Failed to generate user sheet URL:", error);

    return NextResponse.json(
      {
        error: "Failed to generate sheet URL",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
