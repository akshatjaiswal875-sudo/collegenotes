"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, FileText, Download, LogOut, Search, GraduationCap, ClipboardList, FlaskConical, Menu, X, ChevronRight, Star, Clock } from "lucide-react";
import WelcomePopup from "@/components/WelcomePopup";

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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative font-sans">
      <WelcomePopup />
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
      <div className={`fixed md:sticky top-0 h-screen w-72 bg-gradient-to-b from-indigo-900 to-indigo-950 text-white p-6 flex flex-col z-40 transition-transform duration-300 ease-in-out shadow-2xl ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="flex items-center gap-3 mb-10 mt-12 md:mt-0">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner">
            <GraduationCap size={28} className="text-indigo-200" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Student Portal</h1>
            <p className="text-xs text-indigo-300 font-medium">Academic Resources</p>
          </div>
        </div>

        <div className="mb-6 flex-1 overflow-hidden flex flex-col">
          <h2 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
            <Book size={14} /> Subjects
          </h2>
          <div className="space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSubject(s.id);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                  selectedSubject === s.id 
                    ? "bg-white text-indigo-900 font-semibold shadow-lg shadow-indigo-900/20" 
                    : "hover:bg-white/10 text-indigo-100 hover:text-white"
                }`}
              >
                <span className="truncate">{s.name}</span>
                {selectedSubject === s.id && <ChevronRight size={16} className="text-indigo-600" />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2 p-3 rounded-xl bg-white/5 border border-white/5">
            {session?.user?.image ? (
              <img src={session.user.image} className="w-10 h-10 rounded-full border-2 border-indigo-400" />
            ) : (
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-indigo-400 shadow-lg">
                <span className="font-bold text-white">{session?.user?.name?.[0] || "U"}</span>
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{session?.user?.name}</p>
              <p className="text-xs text-indigo-300 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-200 hover:text-red-100 transition-all text-sm font-medium border border-red-500/20"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto h-screen bg-gray-50/50">
        {!selectedSubject ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-8 animate-pulse">
              <BookOpen size={48} className="text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to Your Dashboard</h2>
            <p className="text-gray-500 text-lg mb-8">Select a subject from the sidebar to access notes, question papers, and assignments.</p>
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mb-2"><FileText size={20} /></div>
                <span className="font-medium text-gray-700">Notes</span>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg mb-2"><Star size={20} /></div>
                <span className="font-medium text-gray-700">Papers</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {subjects.find(s => s.id === selectedSubject)?.name}
                  </h1>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
                    {subjects.find(s => s.id === selectedSubject)?.code}
                  </span>
                </div>
                <p className="text-gray-500 flex items-center gap-2 text-sm">
                  <Clock size={14} /> Last updated recently
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                {[
                  { id: "ALL", label: "All" },
                  { id: "NOTE", label: "Notes" },
                  { id: "QP", label: "Papers" },
                  { id: "ASSIGNMENT", label: "Assignments" },
                  { id: "PRACTICAL", label: "Practicals" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      filter === tab.id 
                        ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5" 
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </header>

            <div className="relative mb-8 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
              </div>
              <input
                type="text"
                placeholder="Search for chapters, topics, or keywords..."
                className="w-full pl-11 pr-4 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none shadow-sm bg-white text-gray-900 transition-all placeholder:text-gray-400"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    layout
                    className="bg-white p-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-indigo-100 transition-all duration-300 group flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3.5 rounded-xl transition-colors ${
                        note.type === 'QP' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-100' : 
                        note.type === 'ASSIGNMENT' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-100' :
                        note.type === 'PRACTICAL' ? 'bg-green-50 text-green-600 group-hover:bg-green-100' :
                        'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                      }`}>
                        {note.type === 'QP' ? <FileText size={24} /> : 
                         note.type === 'ASSIGNMENT' ? <ClipboardList size={24} /> :
                         note.type === 'PRACTICAL' ? <FlaskConical size={24} /> :
                         <Book size={24} />}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                        {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {note.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-6 line-clamp-2 flex-1">
                      {note.chapter}
                    </p>

                    <a
                      href={note.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 bg-gray-50 hover:bg-indigo-600 text-gray-700 hover:text-white font-semibold rounded-xl transition-all duration-200 border border-gray-200 hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-200"
                    >
                      <Download size={18} />
                      <span>Download Resource</span>
                    </a>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="text-gray-400" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No materials found</h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
