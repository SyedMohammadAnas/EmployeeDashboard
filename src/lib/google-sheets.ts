import { google } from "googleapis";
import { createSheetsClient } from "./auth-helper";

/**
 * Google Sheets API client configuration
 * Uses service account authentication for server-side access
 */

// Define the structure of a project entry
export interface ProjectEntry {
  email: string;
  name: string;
  projectTitle: string;
  projectDescription: string;
  status: "Not Started" | "In Progress" | "Completed" | "On Hold";
  deadline: string;
  lastUpdated: string;
  priority: "Low" | "Medium" | "High";
  department?: string;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
}

/**
 * Initialize Google Sheets API client with service account credentials
 * @returns Google Sheets API client instance
 */
function getGoogleSheetsClient() {
  try {
    console.log("Getting Google Sheets client...");

    // Use the auth helper for proper authentication
    const sheets = createSheetsClient();

    return sheets;
  } catch (error) {
    console.error("Failed to initialize Google Sheets client:", error);
    throw new Error(`Google Sheets API initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the Google Sheet ID from environment variables
 * @returns Google Sheet ID
 */
function getSheetId(): string {
  // Use the specific sheet ID from the user's request as the primary source
  const sheetId = process.env.GOOGLE_SHEET_ID || "1tMFs1KcNriTRGcpQ_Q_yF_ynrsblMLvXtIeehYZel24";
  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is not set and no fallback available");
  }
  return sheetId;
}

/**
 * Initialize the Google Sheet connection (removed column verification)
 * Simply connects to the sheet without enforcing any structure
 */
export async function initializeSheet(): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = getSheetId();

    // Just verify connection without modifying anything
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    const sheet = spreadsheet.data.sheets?.[0];
    if (!sheet) {
      throw new Error("No sheets found in the spreadsheet");
    }

    const sheetName = sheet.properties?.title || "Sheet1";
    console.log(`Connected to sheet: ${sheetName}`);

    // No column verification or header modification
    console.log("Sheet connection established successfully");
  } catch (error) {
    console.error("Failed to connect to sheet:", error);
    // Don't throw error, just log it to prevent crashes
    console.log("Sheet connection failed, but continuing...");
  }
}

/**
 * Get all project entries from the Google Sheet (simplified - no column structure enforcement)
 * @returns Array of project entries with flexible data mapping
 */
export async function getAllProjects(): Promise<ProjectEntry[]> {
  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = getSheetId();

    // Get the sheet metadata to find the correct sheet name
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    const sheet = spreadsheet.data.sheets?.[0];
    if (!sheet) {
      throw new Error("No sheets found in the spreadsheet");
    }

    const sheetName = sheet.properties?.title || "Sheet1";
    console.log(`Using sheet: ${sheetName}`);

    // Get all data from the sheet (flexible range to capture all data)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A2:Z1000`, // Expanded range to capture any column structure
    });

    const rows = response.data.values || [];

    // Convert rows to ProjectEntry objects with flexible mapping
    const projects: ProjectEntry[] = rows
      .filter(row => row.length > 0 && row[0]) // Filter out empty rows
      .map((row): ProjectEntry => ({
        // Flexible mapping - use whatever data is available in each position
        email: row[0] || "",
        name: row[1] || "",
        projectTitle: row[2] || "",
        projectDescription: row[3] || "",
        status: (row[4] as ProjectEntry["status"]) || "Not Started",
        deadline: row[5] || "",
        lastUpdated: row[6] || "",
        priority: (row[7] as ProjectEntry["priority"]) || "Medium",
        department: row[8] || "",
        estimatedHours: row[9] ? parseInt(row[9]) : undefined,
        actualHours: row[10] ? parseInt(row[10]) : undefined,
        notes: row[11] || "",
      }));

    console.log(`Retrieved ${projects.length} projects from sheet without structure validation`);
    return projects;
  } catch (error) {
    console.error("Failed to get projects:", error);
    // Return empty array instead of throwing to prevent dashboard crashes
    return [];
  }
}

/**
 * Get projects for a specific user by email
 * @param userEmail - User's email address
 * @returns Array of user's project entries
 */
export async function getUserProjects(userEmail: string): Promise<ProjectEntry[]> {
  try {
    const allProjects = await getAllProjects();
    return allProjects.filter(project => project.email === userEmail);
  } catch (error) {
    console.error(`Failed to get projects for user ${userEmail}:`, error);
    throw error;
  }
}

/**
 * Add or update a project entry in the Google Sheet (simplified - no column structure enforcement)
 * If project exists (same email + title), update it; otherwise, add new row
 * @param projectData - Project entry data
 */
export async function addOrUpdateProject(projectData: Partial<ProjectEntry>): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = getSheetId();

    // Get the sheet name dynamically
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    const sheet = spreadsheet.data.sheets?.[0];
    if (!sheet) {
      throw new Error("No sheets found in the spreadsheet");
    }
    const sheetName = sheet.properties?.title || "Sheet1";

    // Simplified validation - just check for basic fields
    if (!projectData.email || !projectData.projectTitle) {
      throw new Error("Email and project title are required");
    }

    // Get current projects to check for existing entry
    const allProjects = await getAllProjects();
    const existingProjectIndex = allProjects.findIndex(
      project => project.email === projectData.email &&
                 project.projectTitle === projectData.projectTitle
    );

    // Prepare the row data - flexible mapping without strict column requirements
    const rowData = [
      projectData.email,
      projectData.name || "",
      projectData.projectTitle,
      projectData.projectDescription || "",
      projectData.status || "Not Started",
      projectData.deadline || "",
      new Date().toISOString().split('T')[0], // Current date as last updated
      projectData.priority || "Medium",
      projectData.department || "",
      projectData.estimatedHours?.toString() || "",
      projectData.actualHours?.toString() || "",
      projectData.notes || "",
    ];

    if (existingProjectIndex >= 0) {
      // Update existing project (row index + 2 because we start from row 2)
      const rowNumber = existingProjectIndex + 2;
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${sheetName}!A${rowNumber}:Z${rowNumber}`, // Flexible range
        valueInputOption: "RAW",
        requestBody: {
          values: [rowData],
        },
      });
      console.log(`Updated project for ${projectData.email}: ${projectData.projectTitle}`);
    } else {
      // Add new project
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${sheetName}!A:Z`, // Flexible range
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [rowData],
        },
      });
      console.log(`Added new project for ${projectData.email}: ${projectData.projectTitle}`);
    }
  } catch (error) {
    console.error("Failed to add/update project:", error);
    throw error;
  }
}

/**
 * Delete a project entry from the Google Sheet
 * @param userEmail - User's email address
 * @param projectTitle - Title of the project to delete
 */
export async function deleteProject(userEmail: string, projectTitle: string): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = getSheetId();

    // Get the sheet name dynamically
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    const sheet = spreadsheet.data.sheets?.[0];
    if (!sheet) {
      throw new Error("No sheets found in the spreadsheet");
    }
    const sheetId_ = sheet.properties?.sheetId || 0;

    // Get current projects to find the row to delete
    const allProjects = await getAllProjects();
    const projectIndex = allProjects.findIndex(
      project => project.email === userEmail && project.projectTitle === projectTitle
    );

    if (projectIndex === -1) {
      throw new Error("Project not found");
    }

    // Delete the row (index + 2 because we start from row 2)
    const rowNumber = projectIndex + 2;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId_,
                dimension: "ROWS",
                startIndex: rowNumber - 1, // 0-based index
                endIndex: rowNumber,
              },
            },
          },
        ],
      },
    });

    console.log(`Deleted project for ${userEmail}: ${projectTitle}`);
  } catch (error) {
    console.error("Failed to delete project:", error);
    throw error;
  }
}

/**
 * Export all projects data as CSV format (simplified - no column structure requirements)
 * @returns CSV string of all project data
 */
export async function exportProjectsAsCSV(): Promise<string> {
  try {
    const projects = await getAllProjects();

    // Create CSV headers - simplified and flexible
    const headers = [
      "Email",
      "Name",
      "Project Title",
      "Project Description",
      "Status",
      "Deadline",
      "Last Updated",
      "Priority",
      "Department",
      "Estimated Hours",
      "Actual Hours",
      "Notes"
    ];

    // Convert projects to CSV rows with flexible data handling
    const csvRows = [
      headers.join(","), // Header row
      ...projects.map(project => [
        `"${project.email || ""}"`,
        `"${project.name || ""}"`,
        `"${project.projectTitle || ""}"`,
        `"${(project.projectDescription || "").replace(/"/g, '""')}"`, // Escape quotes
        `"${project.status || ""}"`,
        `"${project.deadline || ""}"`,
        `"${project.lastUpdated || ""}"`,
        `"${project.priority || ""}"`,
        `"${project.department || ""}"`,
        `"${project.estimatedHours || ""}"`,
        `"${project.actualHours || ""}"`,
        `"${(project.notes || "").replace(/"/g, '""')}"` // Escape quotes
      ].join(","))
    ];

    console.log(`Exported ${projects.length} projects to CSV without column structure requirements`);
    return csvRows.join("\n");
  } catch (error) {
    console.error("Failed to export projects as CSV:", error);
    throw error;
  }
}

/**
 * Export all projects data as Excel format (simplified - no column structure requirements)
 * @returns Buffer containing Excel file data
 */
export async function exportProjectsAsExcel(): Promise<Buffer> {
  try {
    const projects = await getAllProjects();

    // Import ExcelJS dynamically
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Employee Projects');

    // Add headers - flexible and simplified
    const headers = [
      "Email", "Name", "Project Title", "Project Description", "Status",
      "Deadline", "Last Updated", "Priority", "Department",
      "Estimated Hours", "Actual Hours", "Notes"
    ];

    // Style the header row
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    };

    // Add data rows with flexible data handling
    projects.forEach(project => {
      worksheet.addRow([
        project.email || "",
        project.name || "",
        project.projectTitle || "",
        project.projectDescription || "",
        project.status || "",
        project.deadline || "",
        project.lastUpdated || "",
        project.priority || "",
        project.department || "",
        project.estimatedHours || "",
        project.actualHours || "",
        project.notes || ""
      ]);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    // Return Excel file as buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    console.error("Failed to export projects as Excel:", error);
    throw new Error(`Excel export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export all projects data as PDF format
 * @returns Buffer containing PDF file data
 */
export async function exportProjectsAsPDF(): Promise<Buffer> {
  try {
    const projects = await getAllProjects();

    // Import PDFKit dynamically
    const PDFDocument = await import('pdfkit');
    const doc = new PDFDocument.default();

    // Collect the PDF data
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Promise to wait for PDF completion
    const pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Add title
    doc.fontSize(20).text('Employee Projects Report', 50, 50);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
    doc.moveDown(2);

    // Add projects data
    let yPosition = 120;
    projects.forEach((project, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      doc.fontSize(14).text(`Project ${index + 1}: ${project.projectTitle}`, 50, yPosition);
      yPosition += 20;

      doc.fontSize(10)
         .text(`Employee: ${project.name} (${project.email})`, 50, yPosition)
         .text(`Status: ${project.status}`, 50, yPosition + 15)
         .text(`Priority: ${project.priority}`, 50, yPosition + 30)
         .text(`Deadline: ${project.deadline}`, 50, yPosition + 45)
         .text(`Department: ${project.department || 'N/A'}`, 50, yPosition + 60);

      if (project.projectDescription) {
        const description = project.projectDescription.length > 100
          ? project.projectDescription.substring(0, 100) + '...'
          : project.projectDescription;
        doc.text(`Description: ${description}`, 50, yPosition + 75);
      }

      yPosition += 110;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;
    });

    // Finalize the PDF
    doc.end();

    return await pdfPromise;
  } catch (error) {
    console.error("Failed to export projects as PDF:", error);
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get project statistics for dashboard
 * @returns Object with various project statistics
 */
export async function getProjectStats() {
  try {
    const projects = await getAllProjects();

    // Calculate statistics
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === "Completed").length;
    const inProgressProjects = projects.filter(p => p.status === "In Progress").length;
    const notStartedProjects = projects.filter(p => p.status === "Not Started").length;
    const onHoldProjects = projects.filter(p => p.status === "On Hold").length;

    // Calculate overdue projects (deadline passed and not completed)
    const today = new Date();
    const overdueProjects = projects.filter(p => {
      if (p.status === "Completed" || !p.deadline) return false;
      const deadline = new Date(p.deadline);
      return deadline < today;
    }).length;

    // Group by department
    const departmentStats = projects.reduce((acc, project) => {
      const dept = project.department || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by priority
    const priorityStats = projects.reduce((acc, project) => {
      acc[project.priority] = (acc[project.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      notStartedProjects,
      onHoldProjects,
      overdueProjects,
      departmentStats,
      priorityStats,
      completionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
    };
  } catch (error) {
    console.error("Failed to get project statistics:", error);
    throw error;
  }
}

/**
 * Test Google Sheets API connection and authentication
 * @returns Promise<object> - Connection test result
 */
export async function testConnection(): Promise<{
  success: boolean;
  error?: string;
  details?: string;
  metadata?: {
    title: string;
    sheetCount: number;
    lastModified: string;
  };
  sampleDataRows?: number;
}> {
  try {
    console.log("Testing Google Sheets API connection...");

    const sheets = getGoogleSheetsClient();
    const sheetId = getSheetId();

    console.log(`Testing connection to sheet ID: ${sheetId}`);

    // Test 1: Get spreadsheet metadata
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    if (!spreadsheet.data) {
      throw new Error("Failed to retrieve spreadsheet data");
    }

    const metadata = {
      title: spreadsheet.data.properties?.title || "Untitled",
      sheetCount: spreadsheet.data.sheets?.length || 0,
      lastModified: new Date().toISOString(), // Use current time as fallback
    };

    console.log("✅ Spreadsheet metadata retrieved successfully:", metadata);

    // Test 2: Get sheet names
    const sheetNames = spreadsheet.data.sheets?.map(sheet => sheet.properties?.title).filter(Boolean) || [];
    console.log("✅ Sheet names retrieved:", sheetNames);

    // Test 3: Try to read a small amount of data from the first sheet
    if (sheetNames.length > 0) {
      const firstSheetName = sheetNames[0];
      console.log(`Testing data read from sheet: ${firstSheetName}`);

      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${firstSheetName}!A1:Z10`, // Read first 10 rows, first 26 columns
      });

      const sampleDataRows = dataResponse.data.values?.length || 0;
      console.log(`✅ Data read successful. Sample rows: ${sampleDataRows}`);

      return {
        success: true,
        metadata,
        sampleDataRows,
        details: `Successfully connected to Google Sheets API. Sheet: ${metadata.title}, Rows: ${sampleDataRows}`,
      };
    } else {
      throw new Error("No sheets found in the spreadsheet");
    }

  } catch (error) {
    console.error("❌ Google Sheets connection test failed:", error);

    let errorMessage = "Unknown error occurred";
    let errorDetails = "";

    if (error instanceof Error) {
      errorMessage = error.message;

      // Provide specific guidance based on error type
      if (errorMessage.includes("403")) {
        errorDetails = "Access denied. The service account doesn't have permission to access this spreadsheet.";
      } else if (errorMessage.includes("404")) {
        errorDetails = "Spreadsheet not found. Check the GOOGLE_SHEET_ID environment variable.";
      } else if (errorMessage.includes("401")) {
        errorDetails = "Authentication failed. Check service account credentials and permissions.";
      } else if (errorMessage.includes("ENOTFOUND")) {
        errorDetails = "Network error. Check internet connectivity and firewall settings.";
      } else if (errorMessage.includes("timeout")) {
        errorDetails = "Request timeout. The API request took too long to complete.";
      } else {
        errorDetails = "Check service account configuration and Google Sheets API permissions.";
      }
    }

    return {
      success: false,
      error: errorMessage,
      details: errorDetails,
    };
  }
}
