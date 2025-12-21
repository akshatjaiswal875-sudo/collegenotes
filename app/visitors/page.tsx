import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";

export const dynamic = 'force-dynamic';

export default async function VisitorsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.email !== "akshatjaiswal875@gmail.com") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        visitLogs: {
            orderBy: {
                timestamp: 'desc'
            },
            take: 1,
            select: {
                timestamp: true
            }
        }
      },
      orderBy: {
        id: 'desc'
      }
    }) as any; // Cast to any to resolve potential stale type issues in editor

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Visitor Details" />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Registered Users & Visitors</h2>
            <p className="text-sm text-gray-500 mt-1">List of all users who have accessed the platform.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="p-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="p-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Mobile No.</th>
                  <th className="p-4 text-sm font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900">{user.name || "N/A"}</td>
                    <td className="p-4 text-sm text-gray-600">{user.email || "N/A"}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {user.mobile ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {user.mobile}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Not Provided</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {user.visitLogs[0]?.timestamp 
                        ? new Date(user.visitLogs[0].timestamp).toLocaleString() 
                        : "N/A"}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">No visitors found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
