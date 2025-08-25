import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProjectStats } from "@/lib/google-sheets";

/**
 * GET /api/projects/stats
 * Returns project statistics for dashboard
 * Only accessible by HR users
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

    // @ts-ignore - Custom role field added in auth configuration
    const userRole = session.user.role;
    const userEmail = session.user.email;

    // Check if user is HR
    if (userRole !== "hr") {
      console.log(`Access denied for stats: ${userEmail} is not HR`);
      return NextResponse.json(
        { error: "Access denied. Only HR can view project statistics." },
        { status: 403 }
      );
    }

    // Get project statistics
    const stats = await getProjectStats();

    console.log(`Project statistics requested by HR user: ${userEmail}`);

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Failed to get project statistics:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve project statistics",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
