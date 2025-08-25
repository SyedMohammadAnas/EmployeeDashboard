import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllProjects, getUserProjects, initializeSheet } from "@/lib/google-sheets";

/**
 * GET /api/projects
 * Returns projects based on user role:
 * - HR: All projects
 * - Employees: Only their own projects
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

    // Initialize sheet if needed
    await initializeSheet();

    // @ts-ignore - Custom role field added in auth configuration
    const userRole = session.user.role;
    const userEmail = session.user.email;

    let projects;

    if (userRole === "hr") {
      // HR users can see all projects
      projects = await getAllProjects();
      console.log(`HR user ${userEmail} requested all projects`);
    } else {
      // Regular employees can only see their own projects
      projects = await getUserProjects(userEmail);
      console.log(`Employee ${userEmail} requested their projects`);
    }

    return NextResponse.json({
      success: true,
      projects,
      userRole,
      totalCount: projects.length,
    });

  } catch (error) {
    console.error("Failed to get projects:", error);
    return NextResponse.json(
      {
        error: "Failed to retrieve projects",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
