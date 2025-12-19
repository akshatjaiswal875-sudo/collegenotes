"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface NavbarProps {
  title: string;
}

export default function Navbar({ title }: NavbarProps) {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-indigo-900">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {session?.user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
            {session.user.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                className="w-9 h-9 rounded-full border border-gray-200"
              />
            ) : (
              <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-200">
                <span className="font-medium text-sm">
                  {session.user.name?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium"
          title="Sign Out"
        >
          <LogOut size={18} />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
