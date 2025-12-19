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

  const totalUsers = await prisma.user.count();
  const totalVisits = await prisma.visitLog.count();
  const recentVisits = await prisma.visitLog.findMany({
    take: 10,
    orderBy: { timestamp: 'desc' },
    include: { user: { select: { name: true, email: true } } }
  });

  return NextResponse.json({
    totalUsers,
    totalVisits,
    recentVisits
  });
}
