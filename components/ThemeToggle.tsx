"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
    );
  }

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={`Current: ${theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}`}
    >
      {theme === "system" ? (
        <Monitor size={20} className="text-gray-600 dark:text-gray-400" />
      ) : resolvedTheme === "dark" ? (
        <Moon size={20} className="text-indigo-400" />
      ) : (
        <Sun size={20} className="text-yellow-500" />
      )}
    </button>
  );
}
