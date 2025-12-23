"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Upload, Book, Users, LogOut, Plus, FileText, Edit, Trash2, X } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  
  // Forms
  const [noteForm, setNoteForm] = useState({ title: "", chapter: "", driveLink: "", subjectId: "", type: "NOTE" });
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "" });
  const [editingNote, setEditingNote] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (session && (session.user as any).role !== "ADMIN") router.push("/dashboard");
    
    fetchStats();
    fetchSubjects();
    fetchActiveUsers();
  }, [status, session, router]);

  useEffect(() => {
    if (activeTab === "manage-notes") {
      fetchNotes();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    const res = await fetch("/api/stats");
    if (res.ok) setStats(await res.json());
  };

  const fetchActiveUsers = async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) setActiveUsers(await res.json());
  };

  const fetchSubjects = async () => {
    const res = await fetch("/api/subjects");
    if (res.ok) setSubjects(await res.json());
  };

  const fetchNotes = async () => {
    const res = await fetch("/api/notes");
    if (res.ok) setNotes(await res.json());
  };

  const handleUploadNote = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/notes", {
      method: "POST",
      body: JSON.stringify(noteForm),
    });
    alert("Note uploaded!");
    setNoteForm({ ...noteForm, title: "", chapter: "", driveLink: "" });
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/subjects", {
      method: "POST",
      body: JSON.stringify(subjectForm),
    });
    alert("Subject added!");
    setSubjectForm({ name: "", code: "" });
    fetchSubjects();
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
    fetchNotes();
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/notes", {
      method: "PUT",
      body: JSON.stringify(editingNote),
    });
    setEditingNote(null);
    fetchNotes();
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navbar title="Admin Panel" />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 p-6 flex flex-col h-full overflow-y-auto">
          <nav className="flex-1 space-y-2 mt-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "overview" ? "bg-indigo-600" : "hover:bg-gray-700"}`}
          >
            <BarChart3 size={20} /> Overview
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "upload" ? "bg-indigo-600" : "hover:bg-gray-700"}`}
          >
            <Upload size={20} /> Upload Notes
          </button>
          <button
            onClick={() => setActiveTab("manage-notes")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "manage-notes" ? "bg-indigo-600" : "hover:bg-gray-700"}`}
          >
            <FileText size={20} /> Manage Notes
          </button>
          <button
            onClick={() => setActiveTab("subjects")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "subjects" ? "bg-indigo-600" : "hover:bg-gray-700"}`}
          >
            <Book size={20} /> Subjects
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div h-full
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-xl font-bold mb-4">Recent Visitors</h3>
                  <div className="space-y-4">
                    {stats?.recentVisits?.map((visit: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div>
                          <p className="font-medium">{visit.user.name}</p>
                          <p className="text-sm text-gray-400">{visit.user.email}</p>
                        </div>
                        <span className="text-sm text-gray-400" suppressHydrationWarning>{new Date(visit.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <h3 className="text-xl font-bold mb-4">Currently Active Users</h3>
                  <div className="space-y-4">
                    {activeUsers.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-xs">
                              {user.name?.[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Online</span>
                      </div>
                    ))}
                    {activeUsers.length === 0 && <p className="text-gray-400">No active users found.</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h1 className="text-3xl font-bold mb-6">Upload Materials</h1>
              <form onSubmit={handleUploadNote} className="bg-gray-800 p-8 rounded-xl border border-gray-700 max-w-2xl">
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
                  <div className="grid grid-cols-2 gap-4">
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
                        <option value="NOTE">Lecture Note</option>
                        <option value="QP">Question Paper</option>
                        <option value="ASSIGNMENT">Assignment</option>
                        <option value="PRACTICAL">Practical</option>
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

          {activeTab === "manage-notes" && (
            <motion.div
              key="manage-notes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h1 className="text-3xl font-bold mb-6">Manage Notes</h1>
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-700/50 text-gray-400">
                      <tr>
                        <th className="p-4">Title</th>
                        <th className="p-4">Subject</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Chapter</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {notes.map((note) => (
                        <tr key={note.id} className="hover:bg-gray-700/30">
                          <td className="p-4 font-medium">{note.title}</td>
                          <td className="p-4 text-gray-300">{note.subject?.name}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full">
                              {note.type}
                            </span>
                          </td>
                          <td className="p-4 text-gray-400">{note.chapter}</td>
                          <td className="p-4 flex gap-2">
                            <button
                              onClick={() => setEditingNote(note)}
                              className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {notes.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            No notes found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "subjects" && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h1 className="text-3xl font-bold mb-6">Manage Subjects</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  <div className="space-y-2 max-h-100 overflow-y-auto">
                    {subjects.map(s => (
                      <div key={s.id} className="p-3 bg-gray-700/50 rounded-lg flex justify-between items-center">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-sm text-gray-400">{s.code}</span>
                      </div>
                    ))}
                    {subjects.length === 0 && <p className="text-gray-500 text-center py-4">No subjects added yet.</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
      {/* Edit Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Edit Note</h2>
              <button
                onClick={() => setEditingNote(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingNote.title}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, title: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Chapter
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingNote.chapter || ""}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, chapter: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Type
                </label>
                <select
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={editingNote.type}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, type: e.target.value })
                  }
                >
                  <option value="NOTES">Notes</option>
                  <option value="PYQ">PYQ</option>
                  <option value="SAMPLE_PAPER">Sample Paper</option>
                </select>
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
          </div>
        </div>
      )}
    </div>
  );
}
