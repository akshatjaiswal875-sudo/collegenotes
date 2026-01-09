"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, Upload, Book, Users, Plus, FileText, Edit, Trash2, X, 
  CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, 
  UserCog, Menu, RefreshCw, History
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

// Types
interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  branch?: string | null;
  year?: string | null;
  mobile?: string | null;
  _count?: {
    uploadedNotes: number;
    bookmarks: number;
  };
}

interface Subject {
  id: string;
  name: string;
  code: string | null;
  branch?: string | null;
  year?: string | null;
  _count?: {
    notes: number;
  };
}

interface Note {
  id: string;
  title: string;
  chapter: string;
  driveLink: string;
  subjectId: string;
  type: string;
  status: string;
  subject?: { name: string };
  uploadedBy?: { name: string; email: string };
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  totalVisits: number;
  recentVisits: Array<{
    user: { name: string; email: string };
    timestamp: string;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  details: string | null;
  adminId: string;
  adminName: string | null;
  adminEmail: string | null;
  timestamp: string;
}

const NOTE_TYPES = [
  { value: "NOTE", label: "Lecture Note" },
  { value: "QP", label: "Question Paper" },
  { value: "ASSIGNMENT", label: "Assignment" },
  { value: "PRACTICAL", label: "Practical" },
];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [pendingNotes, setPendingNotes] = useState<Note[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // User Management State
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userPagination, setUserPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditFilter, setAuditFilter] = useState("");
  const [auditPagination, setAuditPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });

  // Notes Search/Filter State
  const [noteSearch, setNoteSearch] = useState("");
  const [noteTypeFilter, setNoteTypeFilter] = useState("");

  // Forms
  const [noteForm, setNoteForm] = useState({ 
    title: "", chapter: "", driveLink: "", subjectId: "", type: "NOTE" 
  });
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "" });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (session && session.user.role !== "ADMIN") router.push("/dashboard");

    fetchStats();
    fetchSubjects();
    fetchActiveUsers();
  }, [status, session, router]);

  useEffect(() => {
    if (activeTab === "manage-notes") {
      fetchNotes();
    } else if (activeTab === "approvals") {
      fetchPendingNotes();
    } else if (activeTab === "users") {
      fetchAllUsers();
    } else if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab, auditFilter, auditPagination.page]);

  // Debounced user search
  useEffect(() => {
    if (activeTab === "users") {
      const timer = setTimeout(() => {
        fetchAllUsers();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [userSearch, userPagination.page]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) setStats(await res.json());
    } catch {
      // Stats fetch failed silently
    }
  };

  const fetchActiveUsers = async () => {
    try {
      const res = await fetch("/api/admin/users?type=active");
      if (res.ok) setActiveUsers(await res.json());
    } catch {
      // Active users fetch failed silently
    }
  };

  const fetchAllUsers = async () => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      const params = new URLSearchParams({
        page: userPagination.page.toString(),
        limit: userPagination.limit.toString(),
        ...(userSearch && { search: userSearch }),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users);
        setUserPagination(data.pagination);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) setSubjects(await res.json());
    } catch {
      // Subjects fetch failed silently
    }
  };

  const fetchNotes = async () => {
    setLoading(prev => ({ ...prev, notes: true }));
    try {
      const res = await fetch("/api/notes");
      if (res.ok) setNotes(await res.json());
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(prev => ({ ...prev, notes: false }));
    }
  };

  const fetchPendingNotes = async () => {
    setLoading(prev => ({ ...prev, approvals: true }));
    try {
      const res = await fetch("/api/admin/approvals");
      if (res.ok) setPendingNotes(await res.json());
    } catch {
      toast.error("Failed to load pending notes");
    } finally {
      setLoading(prev => ({ ...prev, approvals: false }));
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(prev => ({ ...prev, audit: true }));
    try {
      const params = new URLSearchParams({
        page: auditPagination.page.toString(),
        limit: auditPagination.limit.toString(),
        ...(auditFilter && { entityType: auditFilter }),
      });
      const res = await fetch(`/api/admin/audit?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs);
        setAuditPagination(data.pagination);
      }
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(prev => ({ ...prev, audit: false }));
    }
  };

  

  const handleApproval = async (noteId: string, action: "APPROVE" | "REJECT") => {
    const toastId = toast.loading(action === "APPROVE" ? "Approving..." : "Rejecting...");
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, action }),
      });

      if (res.ok) {
        toast.success(action === "APPROVE" ? "Note approved!" : "Note rejected", { id: toastId });
        fetchPendingNotes();
        fetchStats();
      } else {
        toast.error("Action failed", { id: toastId });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
    }
  };

  const handleUploadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Uploading note...");
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteForm),
      });
      if (res.ok) {
        toast.success("Note uploaded successfully!", { id: toastId });
        setNoteForm({ title: "", chapter: "", driveLink: "", subjectId: "", type: "NOTE" });
      } else {
        toast.error("Failed to upload note", { id: toastId });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Adding subject...");
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subjectForm),
      });
      if (res.ok) {
        toast.success("Subject added successfully!", { id: toastId });
        setSubjectForm({ name: "", code: "" });
        fetchSubjects();
      } else {
        const error = await res.text();
        toast.error(error || "Failed to add subject", { id: toastId });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    
    const toastId = toast.loading("Updating subject...");
    try {
      const res = await fetch("/api/subjects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSubject),
      });
      if (res.ok) {
        toast.success("Subject updated!", { id: toastId });
        setEditingSubject(null);
        fetchSubjects();
      } else {
        const error = await res.text();
        toast.error(error || "Failed to update subject", { id: toastId });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
    }
  };

  const handleDeleteSubject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    const toastId = toast.loading("Deleting subject...");
    try {
      const res = await fetch(`/api/subjects?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Subject deleted!", { id: toastId });
        fetchSubjects();
      } else {
        const error = await res.text();
        toast.error(error || "Failed to delete subject", { id: toastId });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    const toastId = toast.loading("Deleting note...");
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Note deleted!", { id: toastId });
        fetchNotes();
      } else {
        toast.error("Failed to delete note", { id: toastId });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    
    const toastId = toast.loading("Updating note...");
    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingNote),
      });
      if (res.ok) {
        toast.success("Note updated!", { id: toastId });
        setEditingNote(null);
        fetchNotes();
      } else {
        toast.error("Failed to update note", { id: toastId });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string, userName: string) => {
    const toastId = toast.loading("Updating role...");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        toast.success(`${userName}'s role updated to ${newRole}`, { id: toastId });
        fetchAllUsers();
        fetchActiveUsers();
      } else {
        const error = await res.text();
        toast.error(error || "Failed to update role", { id: toastId });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) return;
    
    const toastId = toast.loading("Deleting user...");
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("User deleted!", { id: toastId });
        fetchAllUsers();
        fetchActiveUsers();
        fetchStats();
      } else {
        const error = await res.text();
        toast.error(error || "Failed to delete user", { id: toastId });
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
    }
  };

  // Filter notes based on search and type
  const filteredNotes = notes.filter(note => {
    const matchesSearch = noteSearch === "" || 
      note.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
      note.chapter.toLowerCase().includes(noteSearch.toLowerCase()) ||
      note.subject?.name.toLowerCase().includes(noteSearch.toLowerCase());
    const matchesType = noteTypeFilter === "" || note.type === noteTypeFilter;
    return matchesSearch && matchesType;
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="flex items-center gap-3">
          <RefreshCw className="animate-spin" size={24} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "upload", label: "Upload Notes", icon: Upload },
    { id: "manage-notes", label: "Manage Notes", icon: FileText },
    { id: "approvals", label: "Approvals", icon: CheckCircle, badge: pendingNotes.length },
    { id: "subjects", label: "Subjects", icon: Book },
    { id: "users", label: "User Management", icon: UserCog },
    { id: "audit", label: "Audit Logs", icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <Navbar title="Admin Panel" />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-indigo-600 rounded-full shadow-lg"
        >
          <Menu size={24} />
        </button>

        {/* Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-300
          fixed lg:relative z-40 w-64 bg-gray-800 p-6 flex flex-col h-[calc(100vh-64px)] overflow-y-auto
        `}>
          <nav className="flex-1 space-y-2 mt-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id ? "bg-indigo-600" : "hover:bg-gray-700"
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h1 className="text-2xl lg:text-3xl font-bold mb-6">Dashboard Overview</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-400">Total Users</h3>
                      <Users className="text-blue-400" />
                    </div>
                    <p className="text-4xl font-bold">{stats?.totalUsers || 0}</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-400">Total Visits</h3>
                      <BarChart3 className="text-green-400" />
                    </div>
                    <p className="text-4xl font-bold">{stats?.totalVisits || 0}</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-gray-400">Pending Approvals</h3>
                      <CheckCircle className="text-yellow-400" />
                    </div>
                    <p className="text-4xl font-bold">{pendingNotes.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-bold mb-4">Recent Visitors</h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {stats?.recentVisits?.map((visit, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{visit.user.name}</p>
                            <p className="text-sm text-gray-400 truncate">{visit.user.email}</p>
                          </div>
                          <span className="text-sm text-gray-400 ml-2 whitespace-nowrap" suppressHydrationWarning>
                            {new Date(visit.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {(!stats?.recentVisits || stats.recentVisits.length === 0) && (
                        <p className="text-gray-400 text-center py-4">No recent visitors</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-bold mb-4">Currently Active Users</h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {activeUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {user.image ? (
                              <Image src={user.image} alt={user.name || ""} width={32} height={32} className="w-8 h-8 rounded-full shrink-0" />
                            ) : (
                              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-xs shrink-0">
                                {user.name?.[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate">{user.name}</p>
                              <p className="text-sm text-gray-400 truncate">{user.email}</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full ml-2">Online</span>
                        </div>
                      ))}
                      {activeUsers.length === 0 && <p className="text-gray-400 text-center py-4">No active users</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Upload Tab */}
            {activeTab === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h1 className="text-2xl lg:text-3xl font-bold mb-6">Upload Materials</h1>
                <form onSubmit={handleUploadNote} className="bg-gray-800 p-6 lg:p-8 rounded-xl border border-gray-700 max-w-2xl">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={noteForm.title}
                        onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                        <select
                          required
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={noteForm.subjectId}
                          onChange={e => setNoteForm({ ...noteForm, subjectId: e.target.value })}
                        >
                          <option value="">Select Subject</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                        <select
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={noteForm.type}
                          onChange={e => setNoteForm({ ...noteForm, type: e.target.value })}
                        >
                          {NOTE_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Chapter / Unit</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={noteForm.chapter}
                        onChange={e => setNoteForm({ ...noteForm, chapter: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Google Drive Link</label>
                      <input
                        type="url"
                        required
                        placeholder="https://drive.google.com/..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={noteForm.driveLink}
                        onChange={e => setNoteForm({ ...noteForm, driveLink: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors mt-4">
                      Upload Material
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Manage Notes Tab */}
            {activeTab === "manage-notes" && (
              <motion.div
                key="manage-notes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h1 className="text-2xl lg:text-3xl font-bold">Manage Notes</h1>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search notes..."
                        className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64"
                        value={noteSearch}
                        onChange={e => setNoteSearch(e.target.value)}
                      />
                    </div>
                    <select
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={noteTypeFilter}
                      onChange={e => setNoteTypeFilter(e.target.value)}
                    >
                      <option value="">All Types</option>
                      {NOTE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-700/50 text-gray-400">
                        <tr>
                          <th className="p-4">Title</th>
                          <th className="p-4 hidden sm:table-cell">Subject</th>
                          <th className="p-4">Type</th>
                          <th className="p-4 hidden md:table-cell">Chapter</th>
                          <th className="p-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {loading.notes ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center">
                              <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                              <span className="text-gray-400">Loading notes...</span>
                            </td>
                          </tr>
                        ) : filteredNotes.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">
                              {noteSearch || noteTypeFilter ? "No matching notes found." : "No notes found."}
                            </td>
                          </tr>
                        ) : (
                          filteredNotes.map((note) => (
                            <tr key={note.id} className="hover:bg-gray-700/30">
                              <td className="p-4">
                                <div className="font-medium">{note.title}</div>
                                <div className="text-sm text-gray-400 sm:hidden">{note.subject?.name}</div>
                              </td>
                              <td className="p-4 text-gray-300 hidden sm:table-cell">{note.subject?.name}</td>
                              <td className="p-4">
                                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full">
                                  {note.type}
                                </span>
                              </td>
                              <td className="p-4 text-gray-400 hidden md:table-cell">{note.chapter}</td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingNote(note)}
                                    className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Subjects Tab */}
            {activeTab === "subjects" && (
              <motion.div
                key="subjects"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h1 className="text-2xl lg:text-3xl font-bold mb-6">Manage Subjects</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <form onSubmit={handleAddSubject} className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-fit">
                    <h3 className="text-xl font-bold mb-4">Add New Subject</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Subject Name</label>
                        <input
                          type="text"
                          required
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={subjectForm.name}
                          onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Subject Code</label>
                        <input
                          type="text"
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={subjectForm.code}
                          onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })}
                        />
                      </div>
                      <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                        <Plus size={20} /> Add Subject
                      </button>
                    </div>
                  </form>

                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h3 className="text-xl font-bold mb-4">Existing Subjects</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {subjects.map(s => (
                        <div key={s.id} className="p-3 bg-gray-700/50 rounded-lg flex justify-between items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="font-medium block truncate">{s.name}</span>
                            <span className="text-sm text-gray-400">{s.code || "No code"}</span>
                            {s._count && (
                              <span className="text-xs text-gray-500 ml-2">({s._count.notes} notes)</span>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => setEditingSubject(s)}
                              className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteSubject(s.id, s.name)}
                              className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {subjects.length === 0 && <p className="text-gray-500 text-center py-4">No subjects added yet.</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Approvals Tab */}
            {activeTab === "approvals" && (
              <motion.div
                key="approvals"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h1 className="text-2xl lg:text-3xl font-bold mb-6">Pending Approvals</h1>

                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  {loading.approvals ? (
                    <div className="p-12 text-center">
                      <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
                      <p className="text-gray-400">Loading approvals...</p>
                    </div>
                  ) : pendingNotes.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="text-lg">No pending approvals</p>
                      <p className="text-sm">All user submissions have been reviewed.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-gray-700/50 text-gray-400 text-sm uppercase">
                          <tr>
                            <th className="p-4">Title</th>
                            <th className="p-4 hidden sm:table-cell">Subject</th>
                            <th className="p-4">Type</th>
                            <th className="p-4 hidden md:table-cell">Submitted By</th>
                            <th className="p-4 hidden lg:table-cell">Date</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {pendingNotes.map((note) => (
                            <tr key={note.id} className="hover:bg-gray-700/30 transition-colors">
                              <td className="p-4">
                                <div className="font-medium text-white">{note.title}</div>
                                <div className="text-sm text-gray-400">{note.chapter}</div>
                                <a href={note.driveLink} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline mt-1 inline-block">
                                  View Resource
                                </a>
                              </td>
                              <td className="p-4 text-gray-300 hidden sm:table-cell">{note.subject?.name}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  note.type === 'QP' ? 'bg-orange-500/20 text-orange-400' :
                                  note.type === 'ASSIGNMENT' ? 'bg-purple-500/20 text-purple-400' :
                                  note.type === 'PRACTICAL' ? 'bg-green-500/20 text-green-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {note.type}
                                </span>
                              </td>
                              <td className="p-4 hidden md:table-cell">
                                <div className="text-sm text-white">{note.uploadedBy?.name || "Unknown"}</div>
                                <div className="text-xs text-gray-500">{note.uploadedBy?.email}</div>
                              </td>
                              <td className="p-4 text-sm text-gray-400 hidden lg:table-cell" suppressHydrationWarning>
                                {new Date(note.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleApproval(note.id, "APPROVE")}
                                    className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors"
                                    title="Approve"
                                  >
                                    <CheckCircle size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleApproval(note.id, "REJECT")}
                                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                                    title="Reject"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* User Management Tab */}
            {activeTab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h1 className="text-2xl lg:text-3xl font-bold">User Management</h1>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-80"
                      value={userSearch}
                      onChange={e => {
                        setUserSearch(e.target.value);
                        setUserPagination(prev => ({ ...prev, page: 1 }));
                      }}
                    />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  {loading.users ? (
                    <div className="p-12 text-center">
                      <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
                      <p className="text-gray-400">Loading users...</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-gray-700/50 text-gray-400 text-sm uppercase">
                            <tr>
                              <th className="p-4">User</th>
                              <th className="p-4 hidden md:table-cell">Branch / Year</th>
                              <th className="p-4 hidden lg:table-cell">Contributions</th>
                              <th className="p-4">Role</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {allUsers.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                  {userSearch ? "No matching users found." : "No users found."}
                                </td>
                              </tr>
                            ) : (
                              allUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      {user.image ? (
                                        <Image src={user.image} alt={user.name || ""} width={40} height={40} className="w-10 h-10 rounded-full shrink-0" />
                                      ) : (
                                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-sm shrink-0">
                                          {user.name?.[0] || "?"}
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <p className="font-medium text-white truncate">{user.name || "Unknown"}</p>
                                        <p className="text-sm text-gray-400 truncate">{user.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 text-gray-300 hidden md:table-cell">
                                    <div>{user.branch || "-"}</div>
                                    <div className="text-sm text-gray-500">{user.year || "-"}</div>
                                  </td>
                                  <td className="p-4 hidden lg:table-cell">
                                    <div className="text-sm">
                                      <span className="text-indigo-400">{user._count?.uploadedNotes || 0}</span> notes
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      <span>{user._count?.bookmarks || 0}</span> bookmarks
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <select
                                      value={user.role}
                                      onChange={(e) => handleUpdateUserRole(user.id, e.target.value, user.name || "User")}
                                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 outline-none cursor-pointer ${
                                        user.role === "ADMIN"
                                          ? "bg-purple-500/20 text-purple-400"
                                          : "bg-gray-600 text-gray-300"
                                      }`}
                                      disabled={user.id === session?.user?.id}
                                    >
                                      <option value="STUDENT">Student</option>
                                      <option value="ADMIN">Admin</option>
                                    </select>
                                  </td>
                                  <td className="p-4 text-right">
                                    {user.id !== session?.user?.id && (
                                      <button
                                        onClick={() => handleDeleteUser(user.id, user.name || "User")}
                                        className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                                        title="Delete User"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {userPagination.totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-gray-700">
                          <p className="text-sm text-gray-400">
                            Showing {((userPagination.page - 1) * userPagination.limit) + 1} to{" "}
                            {Math.min(userPagination.page * userPagination.limit, userPagination.totalCount)} of{" "}
                            {userPagination.totalCount} users
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setUserPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                              disabled={userPagination.page === 1}
                              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <span className="px-4 py-2 bg-gray-700 rounded-lg text-sm">
                              {userPagination.page} / {userPagination.totalPages}
                            </span>
                            <button
                              onClick={() => setUserPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                              disabled={userPagination.page === userPagination.totalPages}
                              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === "audit" && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h1 className="text-2xl lg:text-3xl font-bold">Audit Logs</h1>
                  <select
                    className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={auditFilter}
                    onChange={e => {
                      setAuditFilter(e.target.value);
                      setAuditPagination(prev => ({ ...prev, page: 1 }));
                    }}
                  >
                    <option value="">All Actions</option>
                    <option value="NOTE">Notes</option>
                    <option value="USER">Users</option>
                    <option value="SUBJECT">Subjects</option>
                  </select>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                  {loading.audit ? (
                    <div className="p-12 text-center">
                      <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
                      <p className="text-gray-400">Loading audit logs...</p>
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <History size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="text-lg">No audit logs found</p>
                      <p className="text-sm">Admin actions will appear here once performed.</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-gray-700/50 text-gray-400 text-sm uppercase">
                            <tr>
                              <th className="p-4">Action</th>
                              <th className="p-4 hidden sm:table-cell">Entity</th>
                              <th className="p-4 hidden md:table-cell">Admin</th>
                              <th className="p-4">Time</th>
                              <th className="p-4 hidden lg:table-cell">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {auditLogs.map((log) => {
                              const actionColors: Record<string, string> = {
                                APPROVE_NOTE: "bg-green-500/20 text-green-400",
                                REJECT_NOTE: "bg-red-500/20 text-red-400",
                                DELETE_NOTE: "bg-red-500/20 text-red-400",
                                CREATE_NOTE: "bg-blue-500/20 text-blue-400",
                                UPDATE_NOTE: "bg-yellow-500/20 text-yellow-400",
                                DELETE_USER: "bg-red-500/20 text-red-400",
                                UPDATE_USER_ROLE: "bg-purple-500/20 text-purple-400",
                                CREATE_SUBJECT: "bg-blue-500/20 text-blue-400",
                                UPDATE_SUBJECT: "bg-yellow-500/20 text-yellow-400",
                                DELETE_SUBJECT: "bg-red-500/20 text-red-400",
                              };
                              const actionLabels: Record<string, string> = {
                                APPROVE_NOTE: "Approved Note",
                                REJECT_NOTE: "Rejected Note",
                                DELETE_NOTE: "Deleted Note",
                                CREATE_NOTE: "Created Note",
                                UPDATE_NOTE: "Updated Note",
                                DELETE_USER: "Deleted User",
                                UPDATE_USER_ROLE: "Changed Role",
                                CREATE_SUBJECT: "Created Subject",
                                UPDATE_SUBJECT: "Updated Subject",
                                DELETE_SUBJECT: "Deleted Subject",
                              };
                              let details = null;
                              try {
                                details = log.details ? JSON.parse(log.details) : null;
                              } catch (e) {}

                              return (
                                <tr key={log.id} className="hover:bg-gray-700/30 transition-colors">
                                  <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${actionColors[log.action] || "bg-gray-500/20 text-gray-400"}`}>
                                      {actionLabels[log.action] || log.action}
                                    </span>
                                  </td>
                                  <td className="p-4 hidden sm:table-cell">
                                    <div className="font-medium text-white">{log.entityName || "-"}</div>
                                    <div className="text-xs text-gray-500">{log.entityType}</div>
                                  </td>
                                  <td className="p-4 hidden md:table-cell">
                                    <div className="text-sm text-white">{log.adminName || "Unknown"}</div>
                                    <div className="text-xs text-gray-500">{log.adminEmail}</div>
                                  </td>
                                  <td className="p-4 text-sm text-gray-400" suppressHydrationWarning>
                                    <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                                    <div className="text-xs">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                  </td>
                                  <td className="p-4 hidden lg:table-cell">
                                    {details && (
                                      <div className="text-xs text-gray-400 max-w-xs truncate">
                                        {log.action === "UPDATE_USER_ROLE" && details.previousRole && (
                                          <span>{details.previousRole} → {details.newRole}</span>
                                        )}
                                        {log.action.includes("NOTE") && details.uploadedBy && (
                                          <span>by {details.uploadedBy}</span>
                                        )}
                                        {details.chapter && <span>Ch: {details.chapter}</span>}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {auditPagination.totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-gray-700">
                          <p className="text-sm text-gray-400">
                            Showing {((auditPagination.page - 1) * auditPagination.limit) + 1} to{" "}
                            {Math.min(auditPagination.page * auditPagination.limit, auditPagination.totalCount)} of{" "}
                            {auditPagination.totalCount} logs
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setAuditPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                              disabled={auditPagination.page === 1}
                              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <span className="px-4 py-2 bg-gray-700 rounded-lg text-sm">
                              {auditPagination.page} / {auditPagination.totalPages}
                            </span>
                            <button
                              onClick={() => setAuditPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                              disabled={auditPagination.page === auditPagination.totalPages}
                              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            
          </AnimatePresence>
        </div>
      </div>

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Note</h2>
              <button onClick={() => setEditingNote(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Chapter</label>
                <input
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingNote.chapter || ""}
                  onChange={(e) => setEditingNote({ ...editingNote, chapter: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                <select
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingNote.type}
                  onChange={(e) => setEditingNote({ ...editingNote, type: e.target.value })}
                >
                  {NOTE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Drive Link</label>
                <input
                  type="url"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingNote.driveLink || ""}
                  onChange={(e) => setEditingNote({ ...editingNote, driveLink: e.target.value })}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Subject</h2>
              <button onClick={() => setEditingSubject(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingSubject.name}
                  onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Subject Code</label>
                <input
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingSubject.code || ""}
                  onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value })}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
