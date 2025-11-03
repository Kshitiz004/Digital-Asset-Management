# Digital Asset Management Frontend

Modern Next.js frontend for the Digital Asset Management System with beautiful UI and real-time analytics charts.

## Features

- 🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS
- 📊 **Analytics Dashboard** - Interactive charts using Recharts
  - User analytics: Storage usage, asset distribution, activity timeline
  - Admin analytics: System-wide statistics, most active users
- 📤 **Asset Upload** - Drag & drop file uploads with metadata
- 📋 **Asset Management** - View, download, share, and delete assets
- 🔐 **Authentication** - JWT-based login/register with Google OAuth support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **HTTP Client**: Axios
- **TypeScript**: Full type safety

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

The frontend will run on `http://localhost:3001`.

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Usage

1. **Register/Login** - Create an account or login with existing credentials
2. **Upload Assets** - Go to "My Assets" tab and upload files with optional tags and descriptions
3. **View Analytics** - Check the "Analytics" tab for insights:
   - Personal storage usage
   - Asset type distribution (pie chart)
   - Recent activity timeline
4. **Manage Assets** - Download, share publicly, or delete your files

## Admin Features

If you have admin role, you'll see:
- All system assets across all users
- System-wide analytics dashboard
- Total storage usage across platform
- Most active users ranking

## API Integration

The frontend communicates with the backend API at the configured `NEXT_PUBLIC_API_URL`. Make sure the backend is running before starting the frontend.

## Components

- **LoginForm** - Authentication interface
- **Dashboard** - Main application layout
- **AssetUpload** - File upload form
- **AssetList** - Grid of assets with actions
- **Analytics** - Charts and statistics based on role

## License

MIT


