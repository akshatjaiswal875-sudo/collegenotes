import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuditLogs, EntityType } from "@/lib/audit";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const entityType = searchParams.get("entityType") as EntityType | null;
    const adminId = searchParams.get("adminId");

    const result = await getAuditLogs({
      page,
      limit,
      entityType: entityType || undefined,
      adminId: adminId || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
