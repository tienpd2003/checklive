# Check Live Status

A web application to check account status and manage team memberships.

## Features

- Email status checking
- Team membership verification
- Automatic team reassignment
- Dark mode support
- Clipboard integration for invite links

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with the following variables:
```
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----\n"
SHEET_TOOL_CANVA_ID=1mSljCWqsqKIPQPZDPlQbiivG6zfkKwiR1Fno-CuM_OA
```

3. Set up Google Sheets:
- Create a Google Cloud project
- Enable Google Sheets API
- Create a service account
- Share your Google Sheets with the service account email
- Download the service account credentials

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Setup

1. Google Sheets API:
   - The application accesses one Google Sheets file: "SHEET TOOL CANVA"
   - Sheet ID: 1mSljCWqsqKIPQPZDPlQbiivG6zfkKwiR1Fno-CuM_OA
   - Contains two tabs: "CANVAPRO" and "ADMIN FAM CANVA"
   - The service account needs view permissions on this sheet

2. Sheet Structure:
   - CANVAPRO tab:
     - Column A: Email addresses
     - Column B: Team names
   - ADMIN FAM CANVA tab:
     - Column A: Team names
     - Column B: Status (Live/Dead)

## Development

- Built with Next.js 14
- Uses TypeScript for type safety
- Styled with Tailwind CSS
- Dark mode support
- API routes for backend functionality

## Production

To build for production:

```bash
npm run build
npm start
``` 