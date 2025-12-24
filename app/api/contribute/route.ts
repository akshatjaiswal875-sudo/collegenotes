import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, chapter, driveLink, subjectId, type } = body;

  if (!title || !chapter || !driveLink || !subjectId || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const note = await prisma.note.create({
    data: {
      title,
      chapter,
      driveLink,
      subjectId,
      type,
      status: "PENDING",
      uploadedById: user.id,
    },
  });

  return NextResponse.json(note);
}
