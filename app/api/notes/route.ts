import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { notifyAllUsers } from "@/lib/notifications";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subjectId');

  const where = subjectId ? { subjectId, status: "APPROVED" } : { status: "APPROVED" };

  const notes = await prisma.note.findMany({
    where,
    include: { subject: true },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { title, chapter, driveLink, subjectId, type } = body;

  const note = await prisma.note.create({
    data: {
      title,
      chapter,
      driveLink,
      subjectId,
      type
    },
    include: { subject: true }
  });

  // Create audit log
  await createAuditLog({
    action: "CREATE_NOTE",
    entityType: "NOTE",
    entityId: note.id,
    entityName: title,
    details: { chapter, type, subjectId },
    admin: {
      id: (session.user as any).id,
      name: session.user?.name,
      email: session.user?.email,
    },
  });

  // Notify all users about the new note (exclude the admin who uploaded)
  await notifyAllUsers({
    type: "NEW_NOTE",
    title: "New Note Uploaded! 📚",
    message: `"${title}" has been added to ${note.subject?.name || 'the library'}`,
    data: {
      noteId: note.id,
      subjectId: note.subjectId,
      noteType: type,
    },
    excludeUserId: (session.user as any).id,
  });

  return NextResponse.json(note);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { id, title, chapter, driveLink, subjectId, type } = body;

  if (!id) {
    return new NextResponse("Missing ID", { status: 400 });
  }

  // Get old note for comparison
  const oldNote = await prisma.note.findUnique({ where: { id } });

  const note = await prisma.note.update({
    where: { id },
    data: {
      title,
      chapter,
      driveLink,
      subjectId,
      type
    }
  });

  // Create audit log
  await createAuditLog({
    action: "UPDATE_NOTE",
    entityType: "NOTE",
    entityId: id,
    entityName: title,
    details: { 
      changes: {
        title: oldNote?.title !== title ? { from: oldNote?.title, to: title } : undefined,
        chapter: oldNote?.chapter !== chapter ? { from: oldNote?.chapter, to: chapter } : undefined,
        type: oldNote?.type !== type ? { from: oldNote?.type, to: type } : undefined,
      }
    },
    admin: {
      id: (session.user as any).id,
      name: session.user?.name,
      email: session.user?.email,
    },
  });

  return NextResponse.json(note);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse("Missing ID", { status: 400 });
  }

  // Get note details before deletion for audit log
  const note = await prisma.note.findUnique({ 
    where: { id },
    include: { subject: true }
  });

  await prisma.note.delete({
    where: { id }
  });

  // Create audit log
  await createAuditLog({
    action: "DELETE_NOTE",
    entityType: "NOTE",
    entityId: id,
    entityName: note?.title,
    details: { 
      chapter: note?.chapter,
      type: note?.type,
      subject: note?.subject?.name
    },
    admin: {
      id: (session.user as any).id,
      name: session.user?.name,
      email: session.user?.email,
    },
  });

  return new NextResponse("Deleted", { status: 200 });
}
