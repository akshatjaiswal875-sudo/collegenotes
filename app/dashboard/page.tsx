import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' }
  });

  const recentNotes = await prisma.note.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { subject: true }
  });

  // Serialize dates for client component
  const serializedRecentNotes = recentNotes.map(note => ({
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    subject: {
      ...note.subject,
      createdAt: note.subject.createdAt.toISOString(),
      updatedAt: note.subject.updatedAt.toISOString(),
    }
  }));

  const serializedSubjects = subjects.map(subject => ({
    ...subject,
    createdAt: subject.createdAt.toISOString(),
    updatedAt: subject.updatedAt.toISOString(),
  }));

  return (
    <DashboardClient 
      initialSubjects={serializedSubjects} 
      initialRecentNotes={serializedRecentNotes}
      user={session.user}
    />
  );
}
