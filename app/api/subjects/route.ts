import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export const dynamic = 'force-dynamic';

export async function GET() {
  const subjects = await prisma.subject.findMany({
    include: {
      _count: {
        select: { notes: true }
      }
    },
    orderBy: { name: 'asc' }
  });
  return NextResponse.json(subjects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { name, code } = body;

  if (!name) {
    return new NextResponse("Subject name is required", { status: 400 });
  }

  try {
    const subject = await prisma.subject.create({
      data: { name, code }
    });

    // Create audit log
    await createAuditLog({
      action: "CREATE_SUBJECT",
      entityType: "SUBJECT",
      entityId: subject.id,
      entityName: name,
      details: { code },
      admin: {
        id: (session.user as any).id,
        name: session.user?.name,
        email: session.user?.email,
      },
    });

    return NextResponse.json(subject);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new NextResponse("Subject with this name already exists", { status: 400 });
    }
    throw error;
  }
}

// PUT - Update a subject
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, code, branch, year } = body;

    if (!id) {
      return new NextResponse("Subject ID is required", { status: 400 });
    }

    if (!name) {
      return new NextResponse("Subject name is required", { status: 400 });
    }

    // Get old subject for comparison
    const oldSubject = await prisma.subject.findUnique({ where: { id } });

    const subject = await prisma.subject.update({
      where: { id },
      data: { name, code, branch, year }
    });

    // Create audit log
    await createAuditLog({
      action: "UPDATE_SUBJECT",
      entityType: "SUBJECT",
      entityId: id,
      entityName: name,
      details: {
        changes: {
          name: oldSubject?.name !== name ? { from: oldSubject?.name, to: name } : undefined,
          code: oldSubject?.code !== code ? { from: oldSubject?.code, to: code } : undefined,
        }
      },
      admin: {
        id: (session.user as any).id,
        name: session.user?.name,
        email: session.user?.email,
      },
    });

    return NextResponse.json(subject);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new NextResponse("Subject with this name already exists", { status: 400 });
    }
    if (error.code === 'P2025') {
      return new NextResponse("Subject not found", { status: 404 });
    }
    console.error("Error updating subject:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE - Delete a subject
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Subject ID is required", { status: 400 });
    }

    // Check if subject has associated notes
    const notesCount = await prisma.note.count({
      where: { subjectId: id }
    });

    if (notesCount > 0) {
      return new NextResponse(
        `Cannot delete subject with ${notesCount} associated notes. Delete or reassign notes first.`,
        { status: 400 }
      );
    }

    // Get subject details before deletion for audit log
    const subject = await prisma.subject.findUnique({ where: { id } });

    await prisma.subject.delete({
      where: { id }
    });

    // Create audit log
    await createAuditLog({
      action: "DELETE_SUBJECT",
      entityType: "SUBJECT",
      entityId: id,
      entityName: subject?.name,
      details: { code: subject?.code },
      admin: {
        id: (session.user as any).id,
        name: session.user?.name,
        email: session.user?.email,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return new NextResponse("Subject not found", { status: 404 });
    }
    console.error("Error deleting subject:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
