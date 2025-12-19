import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Debug: Check what schema Prisma is actually using
    let schemaContent = "Could not find schema";
    try {
      // Try to find the schema in the generated client
      const schemaPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client', 'schema.prisma');
      if (fs.existsSync(schemaPath)) {
        schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      } else {
        // Try alternative path for Vercel
        const altPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
        if (fs.existsSync(altPath)) {
          schemaContent = "Found in source: " + fs.readFileSync(altPath, 'utf-8');
        }
      }
    } catch (e) {
      schemaContent = "Error reading schema: " + (e as Error).message;
    }

    // Mask the DB URL
    const dbUrl = process.env.DATABASE_URL || "NOT_SET";
    const maskedUrl = dbUrl.substring(0, 15) + "...";

    // Try to connect
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      status: "success", 
      message: "Database connection successful", 
      userCount,
      debug: {
        maskedUrl,
        schemaProvider: schemaContent.includes('provider = "postgresql"') ? "POSTGRES" : "LIKELY SQLITE",
        schemaSnippet: schemaContent.substring(0, 200)
      }
    });
  } catch (error: any) {
    console.error("Database connection failed:", error);
    
    // Repeat debug info in error case
    let schemaContent = "Could not find schema";
    try {
      const schemaPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client', 'schema.prisma');
      if (fs.existsSync(schemaPath)) {
        schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      }
    } catch (e) {}

    return NextResponse.json({ 
      status: "error", 
      message: "Database connection failed", 
      error: error.message,
      debug: {
        maskedUrl: (process.env.DATABASE_URL || "NOT_SET").substring(0, 15) + "...",
        schemaProvider: schemaContent.includes('provider = "postgresql"') ? "POSTGRES" : "LIKELY SQLITE",
        schemaSnippet: schemaContent.substring(0, 200)
      }
    }, { status: 500 });
  }
}
