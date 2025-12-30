import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { notifyAllUsers, notifyUser } from "@/lib/notifications";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const pendingNotes = await prisma.note.findMany({
    where: { status: "PENDING" },
    include: { 
      subject: true,
      uploadedBy: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(pendingNotes);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { noteId, action } = await req.json(); // action: "APPROVE" or "REJECT"

  if (!noteId || !action) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Get note details for audit log
  const noteDetails = await prisma.note.findUnique({
    where: { id: noteId },
    include: { uploadedBy: { select: { id: true, name: true, email: true } } }
  });

  if (action === "APPROVE") {
    const note = await prisma.note.update({
      where: { id: noteId },
      data: { status: "APPROVED" },
      include: { subject: true }
    });

    // Create audit log
    await createAuditLog({
      action: "APPROVE_NOTE",
      entityType: "NOTE",
      entityId: noteId,
      entityName: noteDetails?.title,
      details: {
        uploadedBy: noteDetails?.uploadedBy?.name || noteDetails?.uploadedBy?.email,
      },
      admin: {
        id: (session.user as any).id,
        name: session.user?.name,
        email: session.user?.email,
      },
    });

    // Notify all users about the new approved note
    await notifyAllUsers({
      type: "NOTE_APPROVED",
      title: "New Note Available! 📚",
      message: `"${note.title}" has been added to ${note.subject?.name || 'the library'}`,
      data: {
        noteId: note.id,
        subjectId: note.subjectId,
        noteType: note.type,
      },
    });

    // Notify the uploader that their note was approved
    if (noteDetails?.uploadedBy?.id) {
      await notifyUser({
        userId: noteDetails.uploadedBy.id,
        type: "NOTE_APPROVED",
        title: "Your Note Was Approved! ✅",
        message: `Your contribution "${note.title}" has been approved and is now available to all users.`,
        data: { noteId: note.id },
      });
    }

    return NextResponse.json(note);
  } else if (action === "REJECT") {
    const note = await prisma.note.update({
      where: { id: noteId },
      data: { status: "REJECTED" }
    });

    // Create audit log
    await createAuditLog({
      action: "REJECT_NOTE",
      entityType: "NOTE",
      entityId: noteId,
      entityName: noteDetails?.title,
      details: {
        uploadedBy: noteDetails?.uploadedBy?.name || noteDetails?.uploadedBy?.email,
      },
      admin: {
        id: (session.user as any).id,
        name: session.user?.name,
        email: session.user?.email,
      },
    });

    return NextResponse.json(note);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
