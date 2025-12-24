# College Notes Portal

A comprehensive platform for students to access lecture notes, question papers, and study materials. Features include bookmarking, community contributions, personalized dashboards, and dark mode support.

## Features

- **User Authentication**: Secure login with Google OAuth
- **Personalized Dashboard**: Filter notes by branch and year
- **Bookmarks**: Save and manage favorite notes
- **Community Contributions**: Students can submit notes for approval
- **Admin Panel**: Manage users, approve contributions, view statistics
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on all devices

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (for production) or SQLite (for local development)

### Installation

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Set up environment variables:
    - Copy `.env.example` to `.env` (if not already done).
    - Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` with your Google Cloud Console credentials.
    - Set `NEXTAUTH_SECRET` to a random string (you can generate one with `openssl rand -base64 32`).
    - Update `NEXTAUTH_URL` to your production URL when deploying.
    - Set `DATABASE_URL` for your PostgreSQL database.

3.  Initialize the database:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production Build

To build the application for production:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

### Deployment

#### Vercel

This project uses PostgreSQL, which is well-supported on Vercel.

1.  Ensure your `DATABASE_URL` is set in Vercel's environment variables.
2.  Run `npx prisma db push` to sync the schema (you can do this locally or in a build hook).
3.  Deploy to Vercel - the build command will handle the rest.

#### VPS / Docker

For VPS deployment or Docker, ensure your PostgreSQL database is accessible.

1.  Set the `DATABASE_URL` environment variable.
2.  Run `npx prisma db push` to sync the schema.
3.  Build and start the application.
# college-Notes
