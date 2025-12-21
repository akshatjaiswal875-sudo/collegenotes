"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Library, ClipboardList, FlaskConical } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="z-10 max-w-4xl w-full text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-white/10 p-6 rounded-full backdrop-blur-lg border border-white/20">
            <GraduationCap size={64} className="text-blue-300" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200"
        >
          College Notes Portal
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-xl text-gray-300 max-w-2xl mx-auto"
        >
          Access lecture notes, previous year question papers, and study materials in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12"
        >
          <button
            onClick={() => signIn("google")}
            className="group relative px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
            Sign in with Google
            <div className="absolute inset-0 rounded-xl ring-2 ring-white/50 group-hover:ring-4 transition-all" />
          </button>


        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 text-left"
        >
          {[
            { icon: BookOpen, title: "Lecture Notes", desc: "Organized by subject and chapter" },
            { icon: Library, title: "Question Papers", desc: "Previous years archive" },
            { icon: ClipboardList, title: "Assignments", desc: "Track your coursework" },
            { icon: FlaskConical, title: "Practicals", desc: "Lab manuals and guides" },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
              <item.icon className="w-8 h-8 text-blue-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        <footer className="mt-20 text-gray-400 text-sm pb-8">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
            <p>&copy; 2025 College Notes Portal. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
