import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get('subjectId');

  const where = subjectId ? { subjectId } : {};

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
    }
  });

  return NextResponse.json(note);
}
