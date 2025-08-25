import { createDriveClient } from "./auth-helper";

/**
 * Google Drive API service for direct file downloads
 * Provides clean file downloads without metadata complexity
 *
 * This replaces the previous metadata-based download system
 * with a simple, direct download approach using Google Drive API
 */

// The specific Google Sheet ID provided by the user
const SHEET_ID = "1tMFs1KcNriTRGcpQ_Q_yF_ynrsblMLvXtIeehYZel24";

/**
 * Supported export formats for Google Sheets
 */
export type ExportFormat = 'csv' | 'excel' | 'pdf';

/**
 * MIME types for different export formats
 */
const EXPORT_MIME_TYPES = {
  csv: 'text/csv',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf'
} as const;

/**
 * Google Drive export MIME types for Google Sheets
 */
const DRIVE_EXPORT_MIME_TYPES = {
  csv: 'text/csv',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf'
} as const;

/**
 * Download a Google Sheet directly as a file using Google Drive API
 * This provides a clean download without any metadata processing
 *
 * @param format - The format to export the file in
 * @returns Buffer containing the file data and content type
 */
export async function downloadSheetFile(format: ExportFormat): Promise<{
  buffer: Buffer;
  contentType: string;
  filename: string;
}> {
  try {
    console.log(`Starting direct download of sheet in ${format} format...`);

    // Initialize Google Drive client
    const drive = createDriveClient();

    // Get the export MIME type for the requested format
    const exportMimeType = DRIVE_EXPORT_MIME_TYPES[format];

    console.log(`Exporting sheet ${SHEET_ID} as ${exportMimeType}`);

    // Export the file directly from Google Drive
    const response = await drive.files.export({
      fileId: SHEET_ID,
      mimeType: exportMimeType,
    }, {
      responseType: 'stream'
    });

    // Collect the stream data into a buffer
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      response.data.on('end', () => {
        const buffer = Buffer.concat(chunks);

        // Generate a simple filename with current date
        const currentDate = new Date().toISOString().split('T')[0];
        const fileExtension = getFileExtension(format);
        const filename = `employee-projects-${currentDate}.${fileExtension}`;

        console.log(`Successfully downloaded ${buffer.length} bytes as ${filename}`);

        resolve({
          buffer,
          contentType: EXPORT_MIME_TYPES[format],
          filename
        });
      });

      response.data.on('error', (error: Error) => {
        console.error("Stream error during download:", error);
        reject(new Error(`Download stream failed: ${error.message}`));
      });
    });

  } catch (error) {
    console.error("Failed to download sheet file:", error);

    // Handle specific Google Drive API errors
    if (error instanceof Error) {
      if (error.message.includes('The file is too large')) {
        throw new Error('The Google Sheet is too large to export in this format. Try reducing the amount of data or use CSV format.');
      } else if (error.message.includes('Permission denied')) {
        throw new Error(`Permission denied: The service account does not have access to the Google Sheet. Please share the sheet with the service account email.`);
      } else if (error.message.includes('File not found')) {
        throw new Error(`Google Sheet with ID ${SHEET_ID} was not found. Please check the sheet ID and ensure it exists.`);
      } else if (error.message.includes('Export format not supported')) {
        throw new Error(`Export format ${format} is not supported for this file type.`);
      }
    }

    throw new Error(`Failed to download sheet file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the file extension for the given format
 * @param format - The export format
 * @returns File extension string
 */
function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'csv';
    case 'excel':
      return 'xlsx';
    case 'pdf':
      return 'pdf';
    default:
      return 'csv';
  }
}

/**
 * Test Google Drive API connection and file access
 * @returns Test result with connection status
 */
export async function testDriveConnection() {
  try {
    console.log("Testing Google Drive API connection...");

    // Initialize Google Drive client
    const drive = createDriveClient();

    // Test 1: Check if we can access the file metadata
    console.log(`Checking access to sheet: ${SHEET_ID}`);
    const fileResponse = await drive.files.get({
      fileId: SHEET_ID,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime'
    });

    const fileMetadata = fileResponse.data;
    console.log("File metadata retrieved:", fileMetadata);

    // Test 2: Try a small export to verify export permissions
    console.log("Testing export capability with CSV format...");
    const testExport = await drive.files.export({
      fileId: SHEET_ID,
      mimeType: 'text/csv',
    }, {
      responseType: 'stream'
    });

    // Just read a small amount to verify it works
    let testDataSize = 0;
    await new Promise<void>((resolve, reject) => {
      testExport.data.on('data', (chunk: Buffer) => {
        testDataSize += chunk.length;
        if (testDataSize > 1024) { // Stop after 1KB
          testExport.data.destroy();
          resolve();
        }
      });

      testExport.data.on('end', () => {
        resolve();
      });

      testExport.data.on('error', reject);
    });

    const testResult = {
      success: true,
      fileMetadata: {
        id: fileMetadata.id,
        name: fileMetadata.name,
        mimeType: fileMetadata.mimeType,
        size: fileMetadata.size,
        createdTime: fileMetadata.createdTime,
        modifiedTime: fileMetadata.modifiedTime,
      },
      testExportSize: testDataSize,
      supportedFormats: ['csv', 'excel', 'pdf'],
      timestamp: new Date().toISOString(),
    };

    console.log("Google Drive connection test successful:", testResult);
    return testResult;
  } catch (error) {
    console.error("Google Drive connection test failed:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      sheetId: SHEET_ID,
      help: "Check that the Google Sheet is shared with the service account and that Drive API is enabled."
    };
  }
}
