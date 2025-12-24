import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export const dynamic = 'force-dynamic';

// GET - Fetch users (with optional filters)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "active" or "all"
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // If type is "active", return only users with active sessions
    if (type === "active") {
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
          role: true
        }
      });
      return NextResponse.json(activeUsers);
    }

    // Otherwise, return all users with pagination and search
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          branch: true,
          year: true,
          mobile: true,
          _count: {
            select: {
              uploadedNotes: true,
              bookmarks: true,
            },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// PUT - Update user role
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return new NextResponse("Missing userId or role", { status: 400 });
    }

    if (!["STUDENT", "ADMIN"].includes(role)) {
      return new NextResponse("Invalid role", { status: 400 });
    }

    // Prevent admins from demoting themselves
    if (userId === (session.user as any).id && role !== "ADMIN") {
      return new NextResponse("Cannot change your own role", { status: 400 });
    }

    // Get user details before update
    const userBefore = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { name: true, email: true, role: true }
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Create audit log
    await createAuditLog({
      action: "UPDATE_USER_ROLE",
      entityType: "USER",
      entityId: userId,
      entityName: updatedUser.name || updatedUser.email || "Unknown",
      details: {
        previousRole: userBefore?.role,
        newRole: role,
      },
      admin: {
        id: (session.user as any).id,
        name: session.user?.name,
        email: session.user?.email,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user role:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE - Delete a user (and their data)
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return new NextResponse("Missing user ID", { status: 400 });
    }

    // Prevent admins from deleting themselves
    if (userId === (session.user as any).id) {
      return new NextResponse("Cannot delete your own account", { status: 400 });
    }

    // Get user details before deletion for audit log
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { name: true, email: true, role: true }
    });

    await prisma.user.delete({
      where: { id: userId },
    });

    // Create audit log
    await createAuditLog({
      action: "DELETE_USER",
      entityType: "USER",
      entityId: userId,
      entityName: user?.name || user?.email || "Unknown",
      details: {
        email: user?.email,
        role: user?.role,
      },
      admin: {
        id: (session.user as any).id,
        name: session.user?.name,
        email: session.user?.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
