# College Notes Portal

A comprehensive platform for students to access lecture notes, question papers, and study materials.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- SQLite (for local development)

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

This project uses SQLite, which is not supported on serverless platforms like Vercel (since the filesystem is ephemeral).
To deploy to Vercel, you should switch to a cloud database like PostgreSQL (e.g., Vercel Postgres, Supabase, Neon).

1.  Update `prisma/schema.prisma`:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```
2.  Update `.env` with your `DATABASE_URL`.
3.  Run `npx prisma db push` to sync the schema.

#### VPS / Docker

If deploying to a VPS or using Docker, SQLite will work fine as long as the database file is persisted.
# college-Notes
