import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  if (action === "APPROVE") {
    const note = await prisma.note.update({
      where: { id: noteId },
      data: { status: "APPROVED" }
    });
    return NextResponse.json(note);
  } else if (action === "REJECT") {
    // Optionally delete the note or mark as REJECTED
    const note = await prisma.note.update({
      where: { id: noteId },
      data: { status: "REJECTED" }
    });
    return NextResponse.json(note);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
