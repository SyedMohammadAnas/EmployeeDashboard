# Employee Project Manager

A simple web application for managing employee projects with direct Google Sheets integration, built with Next.js 14 App Router, NextAuth.js, and Tailwind CSS v4.

## ⚠️ Important Setup Steps

### Google Sheets Configuration

**Works with your existing Google Sheet - no column structure requirements!**

1. **Share your Google Sheet with the service account:**
   - Open your Google Sheet: https://docs.google.com/spreadsheets/d/1tMFs1KcNriTRGcpQ_Q_yF_ynrsblMLvXtIeehYZel24/edit
   - Click the "Share" button in the top right
   - Add this email address: `hr-manager-sheets-service@employee-manager-automation.iam.gserviceaccount.com`
   - Give it "Editor" permissions
   - Click "Send"

2. **That's it! Your existing sheet structure will work:**
   - No need to modify column headers or structure
   - The system adapts to whatever columns you have
   - Direct access to your sheet through the dashboard

## Features

- **Simple Authentication**
  - Google OAuth login with NextAuth.js
  - Domain-based access control
  - Role-based permissions (HR vs Employee)

- **Direct Google Sheets Integration (No Column Requirements)**
  - **HR Dashboard:** Embedded Google Sheet with full editing capabilities
  - **Employee Dashboard:** Instructions and direct link to Google Sheets
  - **Flexible:** Works with any existing sheet structure
  - **Real-time collaboration** through Google Sheets
  - **No database required** - your sheet is the database

- **User-Friendly Interface**
  - Clean, modern design with Tailwind CSS v4
  - Fullscreen viewing for better sheet access
  - Responsive design that works on all devices
  - Clear instructions for employees

## Tech Stack

- **Frontend:** Next.js 14 with App Router, React 19, TypeScript
- **Styling:** Tailwind CSS v4 with modern features
- **Authentication:** NextAuth.js with Google OAuth
- **Data Storage:** Google Sheets (direct embedding)
- **Deployment:** Vercel-ready

## How It Works

### For Employees:
1. **Sign in** with your company Google account
2. **Click "Open Google Sheets"** to access the project spreadsheet
3. **Add your projects** directly in the Google Sheet
4. **Update progress** by editing your rows in the sheet

### For HR:
1. **Sign in** with your HR Google account
2. **View the embedded Google Sheet** directly in the dashboard
3. **Use fullscreen mode** for better viewing
4. **Edit directly** in the embedded sheet or open in a new tab

## Getting Started

### Prerequisites

- Node.js 20 or higher
- Google Cloud Project with Sheets API enabled
- Google Sheet for data storage

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd employee-manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Copy the example and fill in your values:

   ```env
   # NextAuth Configuration
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Google Sheets API (for backend validation)
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
   GOOGLE_PROJECT_ID=your-project-id
   GOOGLE_SHEET_ID=your-sheet-id

   # Company Configuration
   COMPANY_DOMAIN=@yourcompany.com
   HR_EMAILS=hr1@yourcompany.com,hr2@yourcompany.com
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Visit your application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Google Cloud Setup

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API

### 2. Create OAuth Credentials
1. Go to "Credentials" in the Google Cloud Console
2. Create "OAuth 2.0 Client ID" credentials
3. Add your domain to authorized origins
4. Copy the Client ID and Secret to your `.env.local`

### 3. Create Service Account (Optional)
1. Create a new service account
2. Generate a JSON key file
3. Extract the email and private key for your `.env.local`
4. **Note:** The service account is mainly for backend validation - the main functionality uses direct Google Sheets embedding

### 4. Share Google Sheet
**Most Important Step:**
- Share your Google Sheet with:
  - All users who need access (employees and HR)
  - The service account email (for backend features)
- Give appropriate permissions (Editor for editing, Viewer for read-only)

## Common Issues & Troubleshooting

### Can't See the Google Sheet

**Solution:** Make sure your Google Sheet is shared with all users who need access. The sheet should be shared with:
- Individual employee emails, OR
- Your entire company domain (if using Google Workspace)

### Authentication Issues

Make sure your Google OAuth credentials include:
- Authorized JavaScript origins: `http://localhost:3000`
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

### Tailwind CSS v4 Notes

This project uses Tailwind CSS v4. Key differences from v3:
- Uses `@import "tailwindcss"` instead of `@tailwind` directives
- `focus:ring` is now `focus:ring-3` for equivalent styling
- Some utility classes have been renamed (see Tailwind v4 docs)

## Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes (minimal, mainly for auth)
│   ├── auth/              # Authentication pages
│   ├── globals.css        # Global styles (Tailwind v4)
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── dashboard/         # Dashboard components
│   └── ui/                # Reusable UI components
└── lib/                   # Utility libraries
    ├── auth.ts            # NextAuth configuration
    ├── google-sheets.ts   # Google Sheets integration (minimal)
    └── utils.ts           # Utility functions
```

## Deployment

### Vercel Deployment

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Update OAuth URLs** to use your production domain
4. **Deploy**

### Environment Variables for Production

Update these values for production:
- `NEXTAUTH_URL`: Your production domain
- Update Google OAuth redirect URIs
- Verify all secrets are secure

## Why This Approach?

### Advantages of Direct Google Sheets Integration:

1. **Simplicity:** No complex database setup or custom CRUD operations
2. **Familiar Interface:** Everyone knows how to use Google Sheets
3. **Real-time Collaboration:** Google Sheets handles real-time updates automatically
4. **Export/Import:** Built-in Google Sheets features for data manipulation
5. **Backup & History:** Google Sheets provides automatic version history
6. **Mobile Access:** Google Sheets mobile app works seamlessly

### Trade-offs:

- Less custom functionality compared to a full database solution
- Dependent on Google Sheets availability
- Limited to Google Sheets' formatting and validation capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

**Made with ❤️ using Next.js 14, Tailwind CSS v4, and Google Sheets**
