import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Find users who have at least one active session
    const activeUsers = await prisma.user.findMany({
      where: {
        sessions: {
          some: {
            expires: {
              gt: new Date()
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        lastLogin: false // Prisma schema doesn't have lastLogin on User, but we can infer from Session or VisitLog if needed.
      }
    });

    return NextResponse.json(activeUsers);
  } catch (error) {
    console.error("Error fetching active users:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
