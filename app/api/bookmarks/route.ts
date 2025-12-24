import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { noteId } = await req.json();
  if (!noteId) {
    return NextResponse.json({ error: "Note ID required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existingBookmark = await prisma.bookmark.findUnique({
    where: {
      userId_noteId: {
        userId: user.id,
        noteId: noteId,
      },
    },
  });

  if (existingBookmark) {
    await prisma.bookmark.delete({
      where: { id: existingBookmark.id },
    });
    return NextResponse.json({ bookmarked: false });
  } else {
    await prisma.bookmark.create({
      data: {
        userId: user.id,
        noteId: noteId,
      },
    });
    return NextResponse.json({ bookmarked: true });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: user.id },
    include: {
      note: {
        include: {
          subject: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(bookmarks);
}
