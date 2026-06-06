Deployment checklist — PostgreSQL + Vercel

1) Environment variables (set these in Vercel project settings -> Environment Variables):

- DATABASE_URL
  - Value: your PostgreSQL connection string

- DIRECT_URL
  - Value: direct PostgreSQL connection for migrations

- NEXTAUTH_URL
  - Value: https://your-vercel-domain.vercel.app

- NEXTAUTH_SECRET
  - Value: same secret used locally

- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

- NEXT_PUBLIC_VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY


2) Build command (Vercel):

Use the default build command or set it to:

npm run build

This project generates Prisma Client during the build. Apply database changes explicitly before deployment.

3) Migrations strategy:

- Recommended: run migrations manually before deploying:

npx prisma migrate deploy

- If your production database is schema-synced instead of migration-managed, you can use:

npx prisma db push

- The build does not run migrations automatically, which avoids deployment failures like P3005 on existing databases.

4) Safety:

- Do NOT commit `.env` or any service keys.

5) Post-deploy verification:

- Visit your site and sign in with Google.
- Test `/contribute` with a Drive link submission.
- Verify the submitted note records are saved in PostgreSQL and the `Note` record contains `driveLink`.


6) Quick deploy commands (local verification):

npx prisma generate
npx prisma migrate deploy
npm run build
npm run start


7) Summary of deployment notes

- The app uses Prisma with PostgreSQL.
- Build runs Prisma Client generation before `next build`.

If you want, I can also trim any remaining upload-related labels in the admin dashboard.
