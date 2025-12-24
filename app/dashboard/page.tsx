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
  const subjectWhere: any = {};
  if (user?.branch) {
    subjectWhere.OR = [
      { branch: user.branch },
      { branch: null }, // Include subjects without branch (common subjects)
    ];
  }
  if (user?.year) {
    subjectWhere.OR = subjectWhere.OR 
      ? subjectWhere.OR.map((cond: any) => ({ ...cond, year: { in: [user.year, null] } }))
      : [{ year: user.year }, { year: null }];
  }

  const subjects = await prisma.subject.findMany({
    where: Object.keys(subjectWhere).length > 0 ? subjectWhere : undefined,
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
