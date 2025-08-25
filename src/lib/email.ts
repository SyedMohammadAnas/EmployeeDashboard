import nodemailer from "nodemailer";
import { downloadSheetFile } from "./drive-download";

/**
 * Email service for sending automated reports to HR
 * Uses SMTP configuration from environment variables
 */

// Email service configuration

/**
 * Validate email environment variables
 * @returns object with validation results
 */
function validateEmailConfig() {
  const requiredVars = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    HR_EMAILS: process.env.HR_EMAILS,
  };

  const missing = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  return {
    isValid: missing.length === 0,
    missing,
    config: requiredVars,
  };
}

/**
 * Create and configure SMTP transporter
 * @returns Nodemailer transporter instance
 */
function createTransporter() {
  try {
    // Validate configuration first
    const validation = validateEmailConfig();
    if (!validation.isValid) {
      throw new Error(`Missing email configuration: ${validation.missing.join(", ")}`);
    }

    // Use SMTP_USER as FROM_EMAIL if FROM_EMAIL is not set or doesn't match domain
    const smtpUser = process.env.SMTP_USER!;
    const configuredFromEmail = process.env.FROM_EMAIL;

    // For Gmail SMTP, use the SMTP_USER as the from email to avoid authentication issues
    const fromEmail = smtpUser.includes("@gmail.com") ? smtpUser : (configuredFromEmail || smtpUser);

    console.log(`Creating email transporter with host: ${process.env.SMTP_HOST}, user: ${smtpUser}, from: ${fromEmail}`);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // Use TLS
      auth: {
        user: smtpUser,
        pass: process.env.SMTP_PASS,
      },
      // Additional configuration for better reliability
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000, // 5 seconds
      socketTimeout: 10000, // 10 seconds
    });

    return transporter;
  } catch (error) {
    console.error("Failed to create email transporter:", error);
    throw new Error(`Email configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the appropriate FROM email address
 * @returns string - The email address to use as sender
 */
function getFromEmail(): string {
  const smtpUser = process.env.SMTP_USER!;
  const configuredFromEmail = process.env.FROM_EMAIL;

  // For Gmail SMTP, use the SMTP_USER to avoid authentication issues
  if (smtpUser.includes("@gmail.com")) {
    return smtpUser;
  }

  // For other SMTP providers, use configured FROM_EMAIL or fallback to SMTP_USER
  return configuredFromEmail || smtpUser;
}

/**
 * Send automated project report to HR team
 * Professional email with CSV and Excel attachments
 * @param customMessage - Optional custom message to include in email
 * @returns Promise<boolean> - Success status
 */
export async function sendProjectReportToHR(customMessage?: string): Promise<boolean> {
  try {
    // Get HR emails from environment variables
    const hrEmails = process.env.HR_EMAILS?.split(",") || [];
    if (hrEmails.length === 0) {
      throw new Error("No HR emails configured in environment variables");
    }

    // Clean up email addresses (remove whitespace)
    const cleanHrEmails = hrEmails.map(email => email.trim()).filter(email => email);

    if (cleanHrEmails.length === 0) {
      throw new Error("No valid HR emails found");
    }

    console.log(`Sending project report to ${cleanHrEmails.length} HR recipients: ${cleanHrEmails.join(", ")}`);

    // Download actual files from Google Drive instead of generating them
    console.log("Downloading actual files from Google Drive...");
    const csvDownload = await downloadSheetFile("csv");
    const excelDownload = await downloadSheetFile("excel");

    // Use the actual filenames from Google Drive
    const csvFilename = csvDownload.filename;
    const excelFilename = excelDownload.filename;

    // Create transporter
    const transporter = createTransporter();

    // Email configuration
    const fromEmail = getFromEmail();
    const fromName = process.env.FROM_NAME || "Employee Manager System";
    const appName = process.env.APP_NAME || "Employee Project Manager";

    console.log(`Using FROM email: ${fromEmail}, FROM name: ${fromName}`);

    // Prepare professional email content
    const currentDate = new Date().toISOString().split('T')[0];
    const subject = `Weekly Project Report - ${currentDate}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #333; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #2c3e50; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 300; }
          .content { padding: 30px 20px; line-height: 1.6; }
          .footer { background-color: #ecf0f1; padding: 20px; text-align: center; font-size: 12px; color: #7f8c8d; }
          .highlight { background-color: #e8f4fd; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
          .attachment-list { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .attachment-item { display: flex; align-items: center; margin: 8px 0; }
          .attachment-icon { width: 16px; height: 16px; margin-right: 8px; }
          h3 { color: #2c3e50; margin-top: 25px; margin-bottom: 15px; }
          a { color: #3498db; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Employee Project Report</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Generated on ${new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>

          <div class="content">
            <p>Dear HR Team,</p>

            <p>Please find attached the current employee project report as requested. This automated report contains comprehensive data for all active projects and assignments.</p>

            ${customMessage ? `<div class="highlight"><strong>Additional Information:</strong><br>${customMessage}</div>` : ''}

            <h3>Attached Files</h3>
            <div class="attachment-list">
              <div class="attachment-item">
                <span>📊 ${csvFilename}</span>
              </div>
              <div class="attachment-item">
                <span>📈 ${excelFilename}</span>
              </div>
            </div>

            <h3>Report Contents</h3>
            <ul style="margin: 15px 0; padding-left: 20px;">
              <li>Complete employee project assignments</li>
              <li>Current project status and progress tracking</li>
              <li>Priority levels and deadline information</li>
              <li>Department allocations and team assignments</li>
              <li>Time estimates and actual hours logged</li>
              <li>Most recent update timestamps</li>
            </ul>

            <div class="highlight">
              <strong>Data Source:</strong> All information is directly sourced from our Google Sheets database at <a href="https://docs.google.com/spreadsheets/d/1tMFs1KcNriTRGcpQ_Q_yF_ynrsblMLvXtIeehYZel24/edit" target="_blank">Project Management Sheet</a>
            </div>

            <p>For any questions regarding this report or the underlying data, please contact the system administrator.</p>

            <p>Best regards,<br>
            Employee Management System</p>
          </div>

          <div class="footer">
            <p>This is an automated message from ${appName}. Please do not reply to this email address.</p>
            <p>Report generated at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Employee Project Report
Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Dear HR Team,

Please find attached the current employee project report as requested. This automated report contains comprehensive data for all active projects and assignments.

${customMessage ? `Additional Information: ${customMessage}\n\n` : ''}

Attached Files:
- ${csvFilename}
- ${excelFilename}

Report Contents:
- Complete employee project assignments
- Current project status and progress tracking
- Priority levels and deadline information
- Department allocations and team assignments
- Time estimates and actual hours logged
- Most recent update timestamps

Data Source: All information is directly sourced from our Google Sheets database at https://docs.google.com/spreadsheets/d/1tMFs1KcNriTRGcpQ_Q_yF_ynrsblMLvXtIeehYZel24/edit

For any questions regarding this report or the underlying data, please contact the system administrator.

Best regards,
Employee Management System

---
This is an automated message from ${appName}. Please do not reply to this email address.
Report generated at ${new Date().toLocaleString()}
    `;

    // Send email to each HR member with both attachments
    const emailPromises = cleanHrEmails.map(async (hrEmail) => {
      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: hrEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            filename: csvFilename,
            content: csvDownload.buffer,
            contentType: csvDownload.contentType,
          },
          {
            filename: excelFilename,
            content: excelDownload.buffer,
            contentType: excelDownload.contentType,
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      console.log(`Project report sent successfully to: ${hrEmail}`);
    });

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    console.log(`Project report sent to ${cleanHrEmails.length} HR recipients`);
    return true;

  } catch (error) {
    console.error("Failed to send project report email:", error);
    throw error;
  }
}

/**
 * Send professional notification email to HR team
 * @param subject - Email subject
 * @param message - Email message content
 * @param includeAttachment - Whether to include Excel attachment
 * @returns Promise<boolean> - Success status
 */
export async function sendCustomNotificationToHR(
  subject: string,
  message: string,
  includeAttachment: boolean = false
): Promise<boolean> {
  try {
    // Get HR emails from environment variables
    const hrEmails = process.env.HR_EMAILS?.split(",") || [];
    const cleanHrEmails = hrEmails.map(email => email.trim()).filter(email => email);

    if (cleanHrEmails.length === 0) {
      throw new Error("No valid HR emails found");
    }

    // Create transporter
    const transporter = createTransporter();

    // Email configuration
    const fromEmail = getFromEmail();
    const fromName = process.env.FROM_NAME || "Employee Manager System";
    const appName = process.env.APP_NAME || "Employee Project Manager";

    let attachments = [];
    if (includeAttachment) {
      // Download actual Excel file from Google Drive
      console.log("Downloading Excel file from Google Drive...");
      const excelDownload = await downloadSheetFile("excel");

      attachments.push({
        filename: excelDownload.filename,
        content: excelDownload.buffer,
        contentType: excelDownload.contentType,
      });
    }

    // Prepare professional email content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #333; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background-color: #2c3e50; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 300; }
          .content { padding: 30px 20px; line-height: 1.6; }
          .footer { background-color: #ecf0f1; padding: 20px; text-align: center; font-size: 12px; color: #7f8c8d; }
          .highlight { background-color: #e8f4fd; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
          .sheets-link { background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
          .sheets-link:hover { background-color: #2980b9; }
          a { color: #3498db; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Project Management Notification</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>

          <div class="content">
            <p>Dear HR Team,</p>
            <p>${message.replace(/\n/g, '<br>')}</p>

            <div class="highlight">
              <strong>Access Project Data:</strong><br>
              <a href="https://docs.google.com/spreadsheets/d/1tMFs1KcNriTRGcpQ_Q_yF_ynrsblMLvXtIeehYZel24/edit" class="sheets-link" target="_blank">Open Project Management Sheet</a><br>
              <small>View and edit live project data directly in Google Sheets</small>
            </div>

            ${includeAttachment ? `
            <div class="highlight">
              <strong>Attached Files:</strong><br>
              Excel file with current project data is attached for offline analysis.
            </div>
            ` : ''}

            <p>For any questions or assistance, please contact the system administrator.</p>

            <p>Best regards,<br>
            Employee Management System</p>
          </div>

          <div class="footer">
            <p>This is an automated message from ${appName}. Please do not reply to this email address.</p>
            <p>Direct link: <a href="https://docs.google.com/spreadsheets/d/1tMFs1KcNriTRGcpQ_Q_yF_ynrsblMLvXtIeehYZel24/edit" target="_blank">Project Management Sheet</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Project Management Notification
${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Dear HR Team,

${message}

Access Project Data:
View and edit live project data directly at: https://docs.google.com/spreadsheets/d/1tMFs1KcNriTRGcpQ_Q_yF_ynrsblMLvXtIeehYZel24/edit

${includeAttachment ? 'Attached Files:\nExcel file with current project data is attached for offline analysis.\n\n' : ''}For any questions or assistance, please contact the system administrator.

Best regards,
Employee Management System

---
This is an automated message from ${appName}. Please do not reply to this email address.
Direct link: https://docs.google.com/spreadsheets/d/1tMFs1KcNriTRGcpQ_Q_yF_ynrsblMLvXtIeehYZel24/edit
    `;

    // Send email to each HR member
    const emailPromises = cleanHrEmails.map(async (hrEmail) => {
      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: hrEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
        attachments: attachments,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Professional notification sent successfully to: ${hrEmail}`);
    });

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    console.log(`Professional notification sent to ${cleanHrEmails.length} HR recipients`);
    return true;

  } catch (error) {
    console.error("Failed to send professional notification email:", error);
    throw error;
  }
}

/**
 * Validate email configuration only
 * @returns Promise<object> - Configuration validation results
 */
export async function validateEmailConfiguration(): Promise<{success: boolean, configuration: any, message: string}> {
  try {
    const validation = validateEmailConfig();
    if (!validation.isValid) {
      return {
        success: false,
        configuration: {
          hrEmailsConfigured: !!process.env.HR_EMAILS,
          smtpHostConfigured: !!process.env.SMTP_HOST,
          smtpUserConfigured: !!process.env.SMTP_USER,
          smtpPassConfigured: !!process.env.SMTP_PASS,
          fromEmailConfigured: !!process.env.FROM_EMAIL,
          hrEmailCount: process.env.HR_EMAILS?.split(",").length || 0,
          smtpHost: process.env.SMTP_HOST || "Not configured",
          fromEmail: getFromEmail() || "Not configured",
        },
        message: `Email configuration incomplete. Missing: ${validation.missing.join(", ")}`
      };
    }

    // Test transporter creation without sending emails
    const transporter = createTransporter();
    await transporter.verify();

    return {
      success: true,
      configuration: {
        hrEmailsConfigured: true,
        smtpHostConfigured: true,
        smtpUserConfigured: true,
        smtpPassConfigured: true,
        fromEmailConfigured: !!process.env.FROM_EMAIL,
        hrEmailCount: process.env.HR_EMAILS?.split(",").length || 0,
        smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
        fromEmail: getFromEmail(),
      },
      message: "Email configuration is ready for production use"
    };
  } catch (error) {
    return {
      success: false,
      configuration: {
        hrEmailsConfigured: !!process.env.HR_EMAILS,
        smtpHostConfigured: !!process.env.SMTP_HOST,
        smtpUserConfigured: !!process.env.SMTP_USER,
        smtpPassConfigured: !!process.env.SMTP_PASS,
        fromEmailConfigured: !!process.env.FROM_EMAIL,
        hrEmailCount: process.env.HR_EMAILS?.split(",").length || 0,
        smtpHost: process.env.SMTP_HOST || "Not configured",
        fromEmail: getFromEmail() || "Not configured",
      },
      message: `Email configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
