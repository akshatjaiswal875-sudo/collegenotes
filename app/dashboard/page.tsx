"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, FileText, Download, LogOut, Search, GraduationCap, ClipboardList, FlaskConical, Menu, X } from "lucide-react";

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [filter, setFilter] = useState<"ALL" | "NOTE" | "QP" | "ASSIGNMENT" | "PRACTICAL">("ALL");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    fetchSubjects();
    
    // Open sidebar on mobile by default so students can see subjects immediately
    if (window.innerWidth < 768) {
      setSidebarOpen(true);
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedSubject) {
      fetchNotes(selectedSubject);
    } else {
      setNotes([]);
    }
  }, [selectedSubject]);

  const fetchSubjects = async () => {
    const res = await fetch("/api/subjects");
    if (res.ok) setSubjects(await res.json());
  };

  const fetchNotes = async (subjectId: string) => {
    const res = await fetch(`/api/notes?subjectId=${subjectId}`);
    if (res.ok) setNotes(await res.json());
  };

  const filteredNotes = notes.filter(note => {
    const matchesType = filter === "ALL" || note.type === filter;
    const matchesSearch = note.title.toLowerCase().includes(search.toLowerCase()) || 
                          note.chapter.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-indigo-900 text-white p-2 rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed md:sticky top-0 h-screen w-72 bg-indigo-900 text-white p-6 flex flex-col z-40 transition-transform duration-300 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="flex items-center gap-3 mb-8 mt-12 md:mt-0">
          <div className="bg-white/10 p-2 rounded-lg">
            <GraduationCap size={24} />
          </div>
          <h1 className="text-xl font-bold">Student Portal</h1>
        </div>

        <div className="mb-6 flex-1 overflow-hidden flex flex-col">
          <h2 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-4">Subjects</h2>
          <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSubject(s.id);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  selectedSubject === s.id 
                    ? "bg-white text-indigo-900 font-medium shadow-lg" 
                    : "hover:bg-indigo-800 text-indigo-100"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-indigo-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            {session?.user?.image ? (
              <img src={session.user.image} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center">
                {session?.user?.name?.[0] || "U"}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-indigo-300 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-indigo-800 text-indigo-200 transition-colors text-sm"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto h-screen">
        {!selectedSubject ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Book size={64} className="mb-4 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-600">Select a subject to view notes</h2>
            <p>Choose from the list on the left to get started</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {subjects.find(s => s.id === selectedSubject)?.name}
                </h1>
                <p className="text-gray-500">
                  {subjects.find(s => s.id === selectedSubject)?.code}
                </p>
              </div>
              
              <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm border">
                <button
                  onClick={() => setFilter("ALL")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "ALL" ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("NOTE")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "NOTE" ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setFilter("QP")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "QP" ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Papers
                </button>
                <button
                  onClick={() => setFilter("ASSIGNMENT")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "ASSIGNMENT" ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Assignments
                </button>
                <button
                  onClick={() => setFilter("PRACTICAL")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "PRACTICAL" ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  Practicals
                </button>
              </div>
            </header>

            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by chapter or title..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm bg-white text-gray-900"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    layout
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-lg ${
                        note.type === 'QP' ? 'bg-orange-100 text-orange-600' : 
                        note.type === 'ASSIGNMENT' ? 'bg-purple-100 text-purple-600' :
                        note.type === 'PRACTICAL' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {note.type === 'QP' ? <FileText size={24} /> : 
                         note.type === 'ASSIGNMENT' ? <ClipboardList size={24} /> :
                         note.type === 'PRACTICAL' ? <FlaskConical size={24} /> :
                         <Book size={24} />}
                      </div>
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {note.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {note.chapter}
                    </p>

                    <a
                      href={note.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 font-medium rounded-lg transition-colors border border-gray-200 hover:border-indigo-200"
                    >
                      <Download size={18} />
                      Download
                    </a>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredNotes.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p>No materials found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
