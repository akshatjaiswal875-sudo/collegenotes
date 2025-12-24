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

  // Get user with branch and year
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || "" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      branch: true,
      year: true,
    },
  });

  // Build subject filter based on user's branch and year
  let subjectWhere: any = undefined;
  
  if (user?.branch || user?.year) {
    const conditions: any[] = [];
    
    // If user has both branch and year
    if (user?.branch && user?.year) {
      conditions.push(
        { branch: user.branch, year: user.year },
        { branch: user.branch, year: null },
        { branch: null, year: user.year },
        { branch: null, year: null }
      );
    } 
    // If user has only branch
    else if (user?.branch) {
      conditions.push(
        { branch: user.branch },
        { branch: null }
      );
    }
    // If user has only year
    else if (user?.year) {
      conditions.push(
        { year: user.year },
        { year: null }
      );
    }
    
    if (conditions.length > 0) {
      subjectWhere = { OR: conditions };
    }
  }

  const subjects = await prisma.subject.findMany({
    where: subjectWhere,
    orderBy: { name: 'asc' }
  });

  const recentNotes = await prisma.note.findMany({
    where: { status: "APPROVED" },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { subject: true }
  });

  // Serialize dates for client component
  const serializedRecentNotes = recentNotes.map(note => ({
    ...note,
    createdAt: note.createdAt.toISOString(),
    subject: {
      ...note.subject,
    }
  }));

  const serializedSubjects = subjects.map(subject => ({
    ...subject,
  }));

  return (
    <DashboardClient 
      initialSubjects={serializedSubjects} 
      initialRecentNotes={serializedRecentNotes}
      user={{
        ...session.user,
        branch: user?.branch,
        year: user?.year,
      }}
    />
  );
}
