"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, MessageSquare } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import FeedbackModal from "./FeedbackModal";

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  const { data: session } = useSession();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-indigo-900 dark:text-indigo-400">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {session?.user && (
            <>
              {(session.user as any).role !== "ADMIN" && (
                <button
                  onClick={() => setIsFeedbackOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-sm font-medium"
                >
                  <MessageSquare size={18} />
                  <span className="hidden sm:inline">Feedback</span>
                </button>
              )}

              <Link href="/profile" className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{session.user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{session.user.email}</p>
                </div>
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt="Profile"
                    width={36}
                    height={36}
                    className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                    <span className="font-medium text-sm">
                      {session.user.name?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </Link>
            </>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors text-sm font-medium"
            title="Sign Out"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </nav>
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </>
  );
}
