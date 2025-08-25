import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addOrUpdateProject, ProjectEntry } from "@/lib/google-sheets";

/**
 * POST /api/projects/add
 * Adds or updates a project entry
 * Employees can only update their own projects
 * HR can update any project
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const projectData: Partial<ProjectEntry> = body;

    // @ts-ignore - Custom role field added in auth configuration
    const userRole = session.user.role;
    const userEmail = session.user.email;

    // Validate required fields
    if (!projectData.projectTitle?.trim()) {
      return NextResponse.json(
        { error: "Project title is required" },
        { status: 400 }
      );
    }

    // Security check: Employees can only create/update their own projects
    if (userRole !== "hr") {
      if (projectData.email && projectData.email !== userEmail) {
        return NextResponse.json(
          { error: "You can only update your own projects" },
          { status: 403 }
        );
      }
      // Force the email to be the authenticated user's email for employees
      projectData.email = userEmail;
      projectData.name = session.user.name || "";
    }

    // Validate project data
    const validStatuses = ["Not Started", "In Progress", "Completed", "On Hold"];
    const validPriorities = ["Low", "Medium", "High"];

    if (projectData.status && !validStatuses.includes(projectData.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: " + validStatuses.join(", ") },
        { status: 400 }
      );
    }

    if (projectData.priority && !validPriorities.includes(projectData.priority)) {
      return NextResponse.json(
        { error: "Invalid priority. Must be one of: " + validPriorities.join(", ") },
        { status: 400 }
      );
    }

    // Validate deadline format if provided
    if (projectData.deadline) {
      const deadlineDate = new Date(projectData.deadline);
      if (isNaN(deadlineDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid deadline format. Please use YYYY-MM-DD" },
          { status: 400 }
        );
      }
    }

    // Validate hours if provided
    if (projectData.estimatedHours !== undefined &&
        (isNaN(projectData.estimatedHours) || projectData.estimatedHours < 0)) {
      return NextResponse.json(
        { error: "Estimated hours must be a positive number" },
        { status: 400 }
      );
    }

    if (projectData.actualHours !== undefined &&
        (isNaN(projectData.actualHours) || projectData.actualHours < 0)) {
      return NextResponse.json(
        { error: "Actual hours must be a positive number" },
        { status: 400 }
      );
    }

    // Add or update the project
    await addOrUpdateProject(projectData);

    console.log(`Project ${projectData.projectTitle} saved by ${userEmail}`);

    return NextResponse.json({
      success: true,
      message: "Project saved successfully",
      projectTitle: projectData.projectTitle,
    });

  } catch (error) {
    console.error("Failed to save project:", error);
    return NextResponse.json(
      {
        error: "Failed to save project",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
