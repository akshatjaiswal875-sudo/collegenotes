"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, FileText, Download, LogOut, Search, GraduationCap, ClipboardList, FlaskConical, ChevronRight, Clock, BookOpen, Home, Bookmark, Upload, User, ChevronLeft } from "lucide-react";
import WelcomePopup from "@/components/WelcomePopup";
import OnboardingModal from "@/components/OnboardingModal";
import NotificationBell from "@/components/NotificationBell";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import Testimonials, { TestimonialsRef } from "@/components/Testimonials";
import Image from "next/image";

interface Subject {
  id: string;
  name: string;
  code: string | null;
}

interface Note {
  id: string;
  title: string;
  chapter: string;
  driveLink: string;
  type: string;
  subject?: { name: string };
}

interface SearchableNote extends Note {
  subjectId: string;
}

interface UserProfile {
  name: string | null;
  email: string | null;
  image: string | null;
  branch?: string | null;
  year?: string | null;
}

interface DashboardClientProps {
  initialSubjects: Subject[];
  initialRecentNotes: Note[];
  initialSearchableNotes: SearchableNote[];
  user: UserProfile;
}

export default function DashboardClient({ initialSubjects, initialRecentNotes, initialSearchableNotes, user }: DashboardClientProps) {
  const router = useRouter();
  const testimonialsRef = useRef<TestimonialsRef>(null);
  const [subjects] = useState<Subject[]>(initialSubjects);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [recentNotes] = useState<Note[]>(initialRecentNotes);
  const [searchableNotes] = useState<SearchableNote[]>(initialSearchableNotes);
  const [filter, setFilter] = useState<"ALL" | "NOTE" | "QP" | "ASSIGNMENT" | "PRACTICAL">("ALL");
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookmarkedNoteIds, setBookmarkedNoteIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"HOME" | "SUBJECT" | "LIBRARY" | "SUBJECTS_LIST" | "PROFILE">("HOME");
  const [libraryNotes, setLibraryNotes] = useState<Note[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(!user?.branch || !user?.year);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    router.refresh();
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    const res = await fetch("/api/bookmarks");
    if (res.ok) {
      const data = await res.json();
      setBookmarkedNoteIds(new Set(data.map((b: { noteId: string }) => b.noteId)));
      setLibraryNotes(data.map((b: { note: Note }) => b.note));
    }
  };

  const toggleBookmark = async (noteId: string) => {
    const newBookmarks = new Set(bookmarkedNoteIds);
    if (newBookmarks.has(noteId)) {
      newBookmarks.delete(noteId);
    } else {
      newBookmarks.add(noteId);
    }
    setBookmarkedNoteIds(newBookmarks);

    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId }),
    });

    if (res.ok) {
      fetchBookmarks();
    } else {
      fetchBookmarks();
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      fetchNotes(selectedSubject);
    } else {
      setNotes([]);
    }
  }, [selectedSubject]);

  const fetchNotes = async (subjectId: string) => {
    const res = await fetch(`/api/notes?subjectId=${subjectId}`);
    if (res.ok) setNotes(await res.json());
  };

  const normalizedSearch = search.trim().toLowerCase();

  const searchSuggestions = normalizedSearch
    ? [
        ...subjects
          .filter(subject =>
            subject.name.toLowerCase().includes(normalizedSearch) ||
            (subject.code || "").toLowerCase().includes(normalizedSearch)
          )
          .slice(0, 5)
          .map(subject => ({
            kind: "subject" as const,
            id: subject.id,
            label: subject.name,
            detail: subject.code || "Subject",
          })),
        ...searchableNotes
          .filter(note =>
            note.title.toLowerCase().includes(normalizedSearch) ||
            note.chapter.toLowerCase().includes(normalizedSearch) ||
            note.type.toLowerCase().includes(normalizedSearch) ||
            (note.subject?.name || "").toLowerCase().includes(normalizedSearch)
          )
          .slice(0, 8)
          .map(note => ({
            kind: "note" as const,
            id: note.id,
            subjectId: note.subjectId,
            label: note.title,
            detail: `${note.subject?.name || "Subject"} • ${note.type}`,
          })),
      ].slice(0, 10)
    : [];

  const handleSearchSelect = (item: { kind: "subject" | "note"; id: string; subjectId?: string; label: string; detail: string }) => {
    setSearch(item.label);
    setSearchFocused(false);

    if (item.kind === "subject") {
      setSelectedSubject(item.id);
      setView("SUBJECT");
      setFilter("ALL");
      return;
    }

    if (item.subjectId) {
      setSelectedSubject(item.subjectId);
      setView("SUBJECT");
      const detail = item.detail.toLowerCase();
      setFilter(detail.includes("assignment") ? "ASSIGNMENT" : detail.includes("qp") ? "QP" : "ALL");
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesType = filter === "ALL" || note.type === filter;
    const matchesSearch = note.title.toLowerCase().includes(search.toLowerCase()) || 
                          note.chapter.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Mobile Bottom Navigation
  const BottomNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => { setView("HOME"); setSelectedSubject(null); }}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${view === "HOME" ? "text-indigo-600" : "text-gray-400"}`}
        >
          <Home size={22} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button
          onClick={() => setView("SUBJECTS_LIST")}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${view === "SUBJECTS_LIST" || view === "SUBJECT" ? "text-indigo-600" : "text-gray-400"}`}
        >
          <Book size={22} />
          <span className="text-[10px] font-medium">Subjects</span>
        </button>
        <button
          onClick={() => { setView("LIBRARY"); setSelectedSubject(null); }}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${view === "LIBRARY" ? "text-indigo-600" : "text-gray-400"}`}
        >
          <Bookmark size={22} />
          <span className="text-[10px] font-medium">Library</span>
        </button>
        <button
          onClick={() => setView("PROFILE")}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 ${view === "PROFILE" ? "text-indigo-600" : "text-gray-400"}`}
        >
          <User size={22} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );

  // Mobile Header
  const MobileHeader = ({ title, showBack = false }: { title: string; showBack?: boolean }) => (
    <div className="md:hidden sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-30 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={() => setView("SUBJECTS_LIST")} 
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
          >
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
        )}
        <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <PushNotificationToggle />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative font-sans pb-16 md:pb-0">
      <WelcomePopup />
      {showOnboarding && <OnboardingModal user={user} onComplete={handleOnboardingComplete} />}
      
      {/* Desktop Sidebar - Hidden on Mobile */}
      <div className="hidden md:flex fixed md:sticky top-0 h-screen w-72 bg-gradient-to-b from-indigo-900 to-indigo-950 text-white p-6 flex-col z-40 shadow-2xl">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner">
              <GraduationCap size={28} className="text-indigo-200" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Student Portal</h1>
              <p className="text-xs text-indigo-300 font-medium">Academic Resources</p>
            </div>
          </div>
        </div>
        
        {/* Desktop Notification Icons */}
        <div className="flex items-center gap-2 mb-6 px-2">
          <NotificationBell />
          <PushNotificationToggle />
        </div>

        <div className="mb-5 px-2 relative overflow-visible">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-indigo-200/80" />
            </div>
            <input
              type="text"
              placeholder="Search subjects, notes, assignments..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-indigo-200/70 outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            />
          </div>

          {searchFocused && searchSuggestions.length > 0 && (
            <div className="absolute left-2 right-2 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl">
              {searchSuggestions.map((item) => (
                <button
                  key={`desktop-${item.kind}-${item.id}`}
                  type="button"
                  onClick={() => handleSearchSelect(item)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{item.label}</p>
                    <p className="truncate text-xs text-gray-500">{item.detail}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                    {item.kind === "subject" ? "Subject" : "Note"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {searchFocused && search && searchSuggestions.length === 0 && (
            <div className="absolute left-2 right-2 top-full z-50 mt-2 rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-gray-500 shadow-2xl">
              No matches found.
            </div>
          )}
        </div>

        <div className="mb-6 flex-1 overflow-hidden flex flex-col">
          <button
            onClick={() => { setSelectedSubject(null); setView("HOME"); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-3 mb-2 ${
              view === "HOME"
                ? "bg-white text-indigo-900 font-semibold shadow-lg shadow-indigo-900/20"
                : "hover:bg-white/10 text-indigo-100 hover:text-white"
            }`}
          >
            <Home size={20} />
            <span>Home</span>
          </button>

          <button
            onClick={() => { setSelectedSubject(null); setView("LIBRARY"); }}
            className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-3 mb-2 ${
              view === "LIBRARY"
                ? "bg-white text-indigo-900 font-semibold shadow-lg shadow-indigo-900/20"
                : "hover:bg-white/10 text-indigo-100 hover:text-white"
            }`}
          >
            <Bookmark size={20} />
            <span>My Library</span>
          </button>

          <button
            onClick={() => router.push('/contribute')}
            className="w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-3 mb-2 hover:bg-white/10 text-indigo-100 hover:text-white"
          >
            <Upload size={20} />
            <span>Contribute</span>
          </button>

          <button
            onClick={() => router.push('/contribute')}
            className="w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-3 mb-6 hover:bg-white/10 text-indigo-100 hover:text-white"
          >
            <Upload size={20} />
            <span>Contribute</span>
          </button>

          <h2 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
            <Book size={14} /> Subjects
          </h2>
          <div className="space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedSubject(s.id); setView("SUBJECT"); }}
                className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                  selectedSubject === s.id && view === "SUBJECT"
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
            {user?.image ? (
              <Image src={user.image} alt={user.name || "User"} width={40} height={40} className="w-10 h-10 rounded-full border-2 border-indigo-400" />
            ) : (
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center border-2 border-indigo-400 shadow-lg">
                <span className="font-bold text-white">{user?.name?.[0] || "U"}</span>
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-white">{user?.name}</p>
              <p className="text-xs text-indigo-300 truncate">{user?.email}</p>
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
      <div className="flex-1 overflow-y-auto min-h-screen bg-gray-50">
        
        {/* HOME VIEW */}
        {view === "HOME" && (
          <div className="p-4 md:p-10 max-w-6xl mx-auto">
            {/* Mobile Welcome */}
            <div className="mb-6 md:mb-10">
              <div className="flex items-center gap-3 mb-2 md:hidden">
                {user?.image ? (
                  <Image src={user.image} alt={user.name || "User"} width={48} height={48} className="w-12 h-12 rounded-full border-2 border-indigo-200" />
                ) : (
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="font-bold text-white text-lg">{user?.name?.[0] || "U"}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Welcome back,</p>
                  <h1 className="text-xl font-bold text-gray-900">{(user?.name || "Student").split(' ')[0]} 👋</h1>
                </div>
              </div>
              <h1 className="hidden md:block text-3xl font-bold text-gray-900 mb-2">Welcome back, {(user?.name || "Student").split(' ')[0]}! 👋</h1>
              <p className="text-gray-500 text-sm md:text-base">Here&apos;s what&apos;s happening in your courses.</p>
            </div>

            {/* Quick Stats - Mobile Optimized */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-12">
              <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 md:p-6 text-white shadow-lg shadow-indigo-200">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2.5 md:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Book size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="text-indigo-100 text-xs md:text-sm font-medium">Total Subjects</p>
                    <h3 className="text-2xl md:text-2xl font-bold">{subjects.length}</h3>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium">Recent</p>
                    <h3 className="text-xl font-bold text-gray-900">{recentNotes.length}+</h3>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
                    <Bookmark size={20} />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs font-medium">Saved</p>
                    <h3 className="text-xl font-bold text-gray-900">{bookmarkedNoteIds.size}</h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access Subjects - Horizontal Scroll on Mobile */}
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-600" /> Quick Access
            </h2>
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-gray-400" size={20} />
              </div>
              <input
                type="text"
                placeholder="Search subjects, notes, or assignments..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm bg-white text-gray-900 transition-all placeholder:text-gray-400"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              />
              {searchFocused && searchSuggestions.length > 0 && (
                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                  {searchSuggestions.map((item) => (
                    <button
                      key={`${item.kind}-${item.id}`}
                      type="button"
                      onClick={() => handleSearchSelect(item)}
                      className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{item.label}</p>
                        <p className="truncate text-xs text-gray-500">{item.detail}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                        {item.kind === "subject" ? "Subject" : "Note"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {searchFocused && search && searchSuggestions.length === 0 && (
                <div className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-xl">
                  No matches found.
                </div>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible scrollbar-hide">
              {subjects.slice(0, 6).map((subject, index) => (
                <motion.button
                  key={subject.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedSubject(subject.id); setView("SUBJECT"); }}
                  className="shrink-0 w-40 md:w-auto bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br opacity-10 rounded-bl-full ${
                    index % 3 === 0 ? 'from-blue-500 to-cyan-500' : 
                    index % 3 === 1 ? 'from-purple-500 to-pink-500' : 
                    'from-orange-500 to-red-500'
                  }`} />
                  
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold mb-2 ${
                    index % 3 === 0 ? 'bg-blue-50 text-blue-600' : 
                    index % 3 === 1 ? 'bg-purple-50 text-purple-600' : 
                    'bg-orange-50 text-orange-600'
                  }`}>
                    {subject.code || "SUB"}
                  </span>
                  <h3 className="text-sm md:text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {subject.name}
                  </h3>
                </motion.button>
              ))}
            </div>

            {/* Recent Activity */}
            {recentNotes.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-indigo-600" /> Recently Added
                </h2>
                <div className="space-y-3">
                  {recentNotes.slice(0, 5).map((note) => (
                    <a 
                      key={note.id}
                      href={note.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm active:bg-gray-50"
                    >
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        note.type === 'QP' ? 'bg-orange-50 text-orange-600' : 
                        note.type === 'ASSIGNMENT' ? 'bg-purple-50 text-purple-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {note.type === 'QP' ? <FileText size={20} /> : <Book size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{note.title}</h4>
                        <p className="text-xs text-gray-500 truncate">{note.subject?.name}</p>
                      </div>
                      <Download size={18} className="text-gray-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Student Reviews Section */}
            <div className="mt-8">
              <Testimonials ref={testimonialsRef} variant="dashboard" autoPlay={false} showStats={true} />
            </div>
          </div>
        )}

        {/* SUBJECTS LIST VIEW - Mobile Only */}
        {view === "SUBJECTS_LIST" && (
          <div className="md:hidden">
            <MobileHeader title="All Subjects" />
            <div className="p-4 space-y-3">
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search subjects, notes, or assignments..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm bg-white text-gray-900 transition-all placeholder:text-gray-400"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                />
                {searchFocused && searchSuggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                    {searchSuggestions.map((item) => (
                      <button
                        key={`${item.kind}-${item.id}`}
                        type="button"
                        onClick={() => handleSearchSelect(item)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{item.label}</p>
                          <p className="truncate text-xs text-gray-500">{item.detail}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                          {item.kind === "subject" ? "Subject" : "Note"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
              {subjects.map((subject, index) => (
                <button
                  key={subject.id}
                  onClick={() => { setSelectedSubject(subject.id); setView("SUBJECT"); setSearch(subject.name); }}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm active:bg-gray-50"
                >
                  <div className={`p-3 rounded-xl ${
                    index % 3 === 0 ? 'bg-blue-50 text-blue-600' : 
                    index % 3 === 1 ? 'bg-purple-50 text-purple-600' : 
                    'bg-orange-50 text-orange-600'
                  }`}>
                    <Book size={22} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{subject.name}</h3>
                    <p className="text-xs text-gray-500">{subject.code || "View materials"}</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBJECT VIEW */}
        {view === "SUBJECT" && (
          <div className="max-w-6xl mx-auto">
            {/* Mobile Header */}
            <MobileHeader 
              title={subjects.find(s => s.id === selectedSubject)?.name || "Subject"} 
              showBack={true} 
            />
            
            <div className="p-4 md:p-10">
              {/* Desktop Header */}
              <header className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
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
              </header>

              {/* Filter Pills - Horizontal Scroll on Mobile */}
              <div className="flex gap-2 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible scrollbar-hide mb-4">
                {[
                  { id: "ALL", label: "All" },
                  { id: "NOTE", label: "Notes" },
                  { id: "QP", label: "Papers" },
                  { id: "ASSIGNMENT", label: "Assignments" },
                  { id: "PRACTICAL", label: "Practicals" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as typeof filter)}
                    className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                      filter === tab.id 
                        ? "bg-indigo-600 text-white shadow-md" 
                        : "bg-white text-gray-600 border border-gray-200 active:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm bg-white text-gray-900 transition-all placeholder:text-gray-400"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Notes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredNotes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className={`p-3 rounded-xl ${
                          note.type === 'QP' ? 'bg-orange-50 text-orange-600' : 
                          note.type === 'ASSIGNMENT' ? 'bg-purple-50 text-purple-600' :
                          note.type === 'PRACTICAL' ? 'bg-green-50 text-green-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {note.type === 'QP' ? <FileText size={22} /> : 
                           note.type === 'ASSIGNMENT' ? <ClipboardList size={22} /> :
                           note.type === 'PRACTICAL' ? <FlaskConical size={22} /> :
                           <Book size={22} />}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(note.id); }}
                          className={`p-2.5 rounded-full transition-colors ${
                            bookmarkedNoteIds.has(note.id)
                              ? "text-yellow-500 bg-yellow-50"
                              : "text-gray-400 bg-gray-50"
                          }`}
                        >
                          <Bookmark size={18} fill={bookmarkedNoteIds.has(note.id) ? "currentColor" : "none"} />
                        </button>
                      </div>
                      
                      <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">
                        {note.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-1 flex-1">
                        {note.chapter}
                      </p>

                      <a
                        href={note.driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl transition-all active:bg-indigo-700"
                      >
                        <Download size={18} />
                        <span>Download</span>
                      </a>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredNotes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">No materials found</h3>
                  <p className="text-gray-500 text-sm">Try adjusting your search or filter.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LIBRARY VIEW */}
        {view === "LIBRARY" && (
          <div className="max-w-6xl mx-auto">
            <MobileHeader title="My Library" />
            <div className="p-4 md:p-10">
              <h1 className="hidden md:block text-3xl font-bold text-gray-900 mb-2">My Library</h1>
              <p className="hidden md:block text-gray-500 mb-8">Your saved notes and resources.</p>

              {libraryNotes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <AnimatePresence mode="popLayout">
                    {libraryNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        layout
                        className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className={`p-3 rounded-xl ${
                            note.type === 'QP' ? 'bg-orange-50 text-orange-600' : 
                            note.type === 'ASSIGNMENT' ? 'bg-purple-50 text-purple-600' :
                            note.type === 'PRACTICAL' ? 'bg-green-50 text-green-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {note.type === 'QP' ? <FileText size={22} /> : 
                             note.type === 'ASSIGNMENT' ? <ClipboardList size={22} /> :
                             note.type === 'PRACTICAL' ? <FlaskConical size={22} /> :
                             <Book size={22} />}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleBookmark(note.id); }}
                            className="p-2.5 rounded-full text-yellow-500 bg-yellow-50"
                          >
                            <Bookmark size={18} fill="currentColor" />
                          </button>
                        </div>
                        
                        <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">
                          {note.title}
                        </h3>
                        {note.subject && (
                          <p className="text-xs text-indigo-600 font-medium mb-3">{note.subject.name}</p>
                        )}

                        <a
                          href={note.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl transition-all mt-auto active:bg-indigo-700"
                        >
                          <Download size={18} />
                          <span>Download</span>
                        </a>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Bookmark className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Your library is empty</h3>
                  <p className="text-gray-500 text-sm">Bookmark notes to access them here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PROFILE VIEW - Mobile Only */}
        {view === "PROFILE" && (
          <div className="md:hidden">
            <MobileHeader title="Profile" />
            <div className="p-4">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                <div className="flex items-center gap-4 mb-6">
                  {user?.image ? (
                    <Image src={user.image} alt={user.name || "User"} width={72} height={72} className="w-18 h-18 rounded-full border-4 border-indigo-100" />
                  ) : (
                    <div className="w-18 h-18 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="font-bold text-white text-2xl">{user?.name?.[0] || "U"}</span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    {user?.branch && (
                      <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full">
                        {user.branch} • Year {user.year}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600">{bookmarkedNoteIds.size}</p>
                    <p className="text-xs text-gray-500">Bookmarks</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-600">{subjects.length}</p>
                    <p className="text-xs text-gray-500">Subjects</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/contribute')}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm active:bg-gray-50"
                >
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Upload size={22} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">Contribute Notes</h3>
                    <p className="text-xs text-gray-500">Share your study materials</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100 active:bg-red-100"
                >
                  <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                    <LogOut size={22} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-red-600">Sign Out</h3>
                    <p className="text-xs text-red-400">Log out of your account</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
