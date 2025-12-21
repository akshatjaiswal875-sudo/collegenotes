"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, BookOpen, Quote } from "lucide-react";
import { useState, useEffect } from "react";

const quotes = [
  "Success is the sum of small efforts, repeated day in and day out.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Education is the most powerful weapon which you can use to change the world.",
  "Don't watch the clock; do what it does. Keep going.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it."
];

export default function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Check if we've shown the popup in this session
    const hasShown = sessionStorage.getItem("welcomePopupShown");
    if (!hasShown) {
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      // Small delay to show after page load
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("welcomePopupShown", "true");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 to-purple-600" />
            <div className="absolute top-0 right-0 p-4">
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative pt-12 px-8 pb-8 text-center">
              <div className="mx-auto w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 relative z-10">
                <Sparkles className="text-indigo-600" size={32} />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h3>
              <p className="text-gray-500 mb-6">Ready to learn something new today?</p>

              <div className="bg-indigo-50 rounded-xl p-6 relative">
                <Quote className="absolute top-4 left-4 text-indigo-200" size={24} />
                <p className="text-indigo-900 font-medium italic relative z-10 pt-2">
                  "{quote}"
                </p>
              </div>

              <button
                onClick={handleClose}
                className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-200"
              >
                Let's Start Learning
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
