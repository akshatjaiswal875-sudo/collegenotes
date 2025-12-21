import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.email !== "akshatjaiswal875@gmail.com") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        visitLogs: {
            orderBy: {
                timestamp: 'desc'
            },
            take: 1,
            select: {
                timestamp: true
            }
        }
      },
      orderBy: {
        id: 'desc'
      }
    }) as any; // Cast to any to resolve potential stale type issues in editor

    // Format the data
    const formattedUsers = users.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        lastVisit: user.visitLogs[0]?.timestamp || null
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
