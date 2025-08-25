import { google } from "googleapis";
import path from "path";

/**
 * Initialize Google Sheets API client using service account JSON file
 * This approach ensures proper authentication and project association
 */
export function createSheetsClient() {
  try {
    console.log("Creating Google Sheets client with service account JSON...");

    // Use the service account JSON file directly
    const serviceAccountPath = path.join(process.cwd(), 'employee-manager-automation-4fec227e1d76.json');

    // Create auth client using service account file
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ],
    });

    // Create sheets client
    const sheets = google.sheets({
      version: 'v4',
      auth: auth
    });

    console.log("Google Sheets client created successfully");
    return sheets;
  } catch (error) {
    console.error("Failed to create Google Sheets client:", error);
    throw new Error(`Google Sheets client creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Initialize Google Drive API client using service account JSON file
 * Used for direct file downloads and exports
 */
export function createDriveClient() {
  try {
    console.log("Creating Google Drive client with service account JSON...");

    // Use the service account JSON file directly
    const serviceAccountPath = path.join(process.cwd(), 'employee-manager-automation-4fec227e1d76.json');

    // Create auth client using service account file
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ],
    });

    // Create drive client
    const drive = google.drive({
      version: 'v3',
      auth: auth
    });

    console.log("Google Drive client created successfully");
    return drive;
  } catch (error) {
    console.error("Failed to create Google Drive client:", error);
    throw new Error(`Google Drive client creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
