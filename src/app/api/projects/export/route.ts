import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exportProjectsAsCSV, exportProjectsAsExcel, exportProjectsAsPDF } from "@/lib/google-sheets";

/**
 * GET /api/projects/export?format=csv|excel|pdf
 * Exports all projects in the specified format
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
      console.log(`Access denied for export: ${userEmail} is not HR`);
      return NextResponse.json(
        { error: "Access denied. Only HR can export project data." },
        { status: 403 }
      );
    }

    // Get format from query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    let filename: string;
    let contentType: string;
    let exportData: string | Buffer;

    // Export based on format
    switch (format.toLowerCase()) {
      case 'csv':
        exportData = await exportProjectsAsCSV();
        filename = `employee-projects-${currentDate}.csv`;
        contentType = 'text/csv';
        break;

      case 'excel':
        exportData = await exportProjectsAsExcel();
        filename = `employee-projects-${currentDate}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;

      case 'pdf':
        exportData = await exportProjectsAsPDF();
        filename = `employee-projects-${currentDate}.pdf`;
        contentType = 'application/pdf';
        break;

      default:
        return NextResponse.json(
          { error: "Invalid format. Supported formats: csv, excel, pdf" },
          { status: 400 }
        );
    }

    console.log(`Projects exported as ${format.toUpperCase()} by HR user: ${userEmail}`);

    // Return file
    return new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error("Failed to export projects:", error);
    return NextResponse.json(
      {
        error: "Failed to export projects",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
